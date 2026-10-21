import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { sendWelcomeEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'focusli-super-secret-key-2026';

const sanitizeUser = (user: IUser) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, userId: clientUserId } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail / email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

    if (existingUser && existingUser.password) {
      return res.status(400).json({
        error: 'An account with this email already exists. Please log in instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedName = name && typeof name === 'string' && name.trim() ? name.trim() : 'Focus Champion';

    let user: IUser;
    let isNewUser = false;

    if (existingUser) {
      // User existed without password (e.g. from device sync)
      existingUser.password = hashedPassword;
      if (resolvedName) existingUser.name = resolvedName;
      existingUser.lastActiveAt = new Date();
      await existingUser.save();
      user = existingUser;
    } else {
      // Create fresh user
      const userId = clientUserId || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      user = new User({
        userId,
        email: normalizedEmail,
        password: hashedPassword,
        name: resolvedName,
        focusingSince: `${new Date().toLocaleString('default', { month: 'short' })}, ${new Date().getFullYear()}`,
        welcomeEmailSent: false,
      });
      await user.save();
      isNewUser = true;
    }

    // Send welcome email with nodemailer on first-time registration / login
    if (!user.welcomeEmailSent) {
      sendWelcomeEmail(normalizedEmail, user.name)
        .then(async (result) => {
          if (result.sent) {
            await User.updateOne({ _id: user._id }, { $set: { welcomeEmailSent: true } });
          }
        })
        .catch((err) => console.error('[AuthController] Welcome email background error:', err));
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome email sent.',
      user: sanitizeUser(user),
      token,
      isNewUser: true,
    });
  } catch (error: any) {
    console.error('[AuthController] register error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to register' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, name, userId: clientUserId } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid Gmail / email address.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    // If no user exists with this email, automatically offer friendly auto-registration
    if (!user) {
      if (password.length < 6) {
        return res.status(404).json({
          error: 'No account found with this email. To create a new account, password must be at least 6 characters.',
        });
      }

      // Auto-register first time user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = clientUserId || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const resolvedName = name && typeof name === 'string' && name.trim() ? name.trim() : 'Focus Champion';

      user = new User({
        userId,
        email: normalizedEmail,
        password: hashedPassword,
        name: resolvedName,
        focusingSince: `${new Date().toLocaleString('default', { month: 'short' })}, ${new Date().getFullYear()}`,
        welcomeEmailSent: false,
      });
      await user.save();

      // Send welcome email with nodemailer
      sendWelcomeEmail(normalizedEmail, user.name)
        .then(async (result) => {
          if (result.sent) {
            await User.updateOne({ _id: user!._id }, { $set: { welcomeEmailSent: true } });
          }
        })
        .catch((err) => console.error('[AuthController] Welcome email background error:', err));

      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Account created and logged in! Welcome email sent.',
        user: sanitizeUser(user),
        token,
        isNewUser: true,
      });
    }

    // User exists. If no password was set yet:
    if (!user.password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    // If first time user logging in without having received email:
    if (!user.welcomeEmailSent) {
      sendWelcomeEmail(normalizedEmail, user.name)
        .then(async (result) => {
          if (result.sent) {
            await User.updateOne({ _id: user!._id }, { $set: { welcomeEmailSent: true } });
          }
        })
        .catch((err) => console.error('[AuthController] Welcome email error:', err));
    }

    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: sanitizeUser(user),
      token,
      isNewUser: false,
    });
  } catch (error: any) {
    console.error('[AuthController] login error:', error);
    return res.status(500).json({ error: error?.message || 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
