-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to notify on case assignment
CREATE OR REPLACE FUNCTION public.notify_case_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'Case Assignment',
      'You have been assigned to case ' || NEW.case_number,
      'info',
      '/cases'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function to notify on case status change
CREATE OR REPLACE FUNCTION public.notify_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- Notify assigned analyst
    IF NEW.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        NEW.assigned_to,
        'Case Status Updated',
        'Case ' || NEW.case_number || ' status changed to ' || NEW.status,
        CASE 
          WHEN NEW.status = 'analysis_complete' THEN 'success'
          WHEN NEW.status = 'under_review' THEN 'warning'
          ELSE 'info'
        END,
        '/cases'
      );
    END IF;
    
    -- Notify supervisor if exists
    IF NEW.supervisor_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.supervisor_id,
        'Case Status Updated',
        'Case ' || NEW.case_number || ' status changed to ' || NEW.status,
        'info',
        '/cases'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to notify on exhibit status change
CREATE OR REPLACE FUNCTION public.notify_exhibit_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  case_analyst UUID;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get the analyst assigned to the case
    SELECT assigned_to INTO case_analyst
    FROM cases
    WHERE id = NEW.case_id;
    
    IF case_analyst IS NOT NULL THEN
      PERFORM create_notification(
        case_analyst,
        'Exhibit Status Updated',
        'Exhibit ' || NEW.exhibit_number || ' status changed to ' || NEW.status,
        CASE 
          WHEN NEW.status = 'analysis_complete' THEN 'success'
          WHEN NEW.status = 'awaiting_analysis' THEN 'warning'
          ELSE 'info'
        END,
        '/exhibits'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_case_assignment
AFTER INSERT OR UPDATE OF assigned_to ON public.cases
FOR EACH ROW
EXECUTE FUNCTION notify_case_assignment();

CREATE TRIGGER trigger_notify_case_status
AFTER UPDATE OF status ON public.cases
FOR EACH ROW
EXECUTE FUNCTION notify_case_status_change();

CREATE TRIGGER trigger_notify_exhibit_status
AFTER UPDATE OF status ON public.exhibits
FOR EACH ROW
EXECUTE FUNCTION notify_exhibit_status_change();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;