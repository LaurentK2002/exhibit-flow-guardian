// Local authentication system to replace Supabase Auth
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-local-jwt-secret'
const JWT_EXPIRES_IN = '24h'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  badge_number?: string
  department?: string
}

export interface AuthResponse {
  user: User | null
  token: string | null
  error: string | null
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, badge_number, department, password_hash FROM profiles WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return { user: null, token: null, error: 'Invalid credentials' }
    }

    const user = result.rows[0]
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return { user: null, token: null, error: 'Invalid credentials' }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Update last login
    await query(
      'UPDATE profiles SET updated_at = NOW() WHERE id = $1',
      [user.id]
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        badge_number: user.badge_number,
        department: user.department
      },
      token,
      error: null
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return { user: null, token: null, error: 'Authentication failed' }
  }
}

export async function createUser(userData: {
  email: string
  password: string
  full_name: string
  badge_number?: string
  role?: string
  department?: string
}): Promise<AuthResponse> {
  try {
    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(userData.password, saltRounds)

    // Insert user
    const result = await query(`
      INSERT INTO profiles (email, password_hash, full_name, badge_number, role, department)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, role, badge_number, department
    `, [
      userData.email,
      passwordHash,
      userData.full_name,
      userData.badge_number,
      userData.role || 'investigator',
      userData.department || 'Cyber Crimes Unit'
    ])

    const user = result.rows[0]

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        badge_number: user.badge_number,
        department: user.department
      },
      token: null,
      error: null
    }
  } catch (error: any) {
    console.error('Create user error:', error)
    if (error.code === '23505') { // Unique violation
      return { user: null, token: null, error: 'Email or badge number already exists' }
    }
    return { user: null, token: null, error: 'Failed to create user' }
  }
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.userId,
      email: decoded.email,
      full_name: decoded.full_name || '',
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify current password
    const result = await query('SELECT password_hash FROM profiles WHERE id = $1', [userId])
    
    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' }
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await query(
      'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    )

    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Failed to change password' }
  }
}