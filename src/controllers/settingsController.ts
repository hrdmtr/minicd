import { Request, Response, NextFunction } from 'express';

/**
 * Get settings page
 */
export const getSettingsPage = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get current language from cookie or default to English
    const currentLanguage = req.cookies.language || 'en';
    
    // @ts-ignore
    res.render('settings', {
      title: 'Settings',
      currentLanguage,
      successMessage: req.query.success ? 'Settings saved successfully' : null,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update settings
 */
export const updateSettings = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { language, theme } = req.body;
    
    // Set language cookie (expires in 1 year)
    if (language && (language === 'en' || language === 'ja')) {
      res.cookie('language', language, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true
      });
    }
    
    // In the future, we can handle theme settings here
    
    // Redirect to settings page with success message
    res.redirect('/settings?success=true');
  } catch (error) {
    next(error);
  }
};