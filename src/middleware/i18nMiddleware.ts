import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// 言語ファイルの読み込み
const loadTranslations = (lang: string) => {
  try {
    const filePath = path.join(__dirname, `../locales/${lang}.json`);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    return {};
  }
};

// 英語と日本語の翻訳をロード
const translations: Record<string, any> = {
  en: loadTranslations('en'),
  ja: loadTranslations('ja')
};

// 翻訳関数
const translate = (lang: string, key: string): string => {
  const keys = key.split('.');
  // 指定された言語の翻訳がなければ英語にフォールバック
  let value = translations[lang] || translations.en;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // キーが見つからない場合はキー自体を返す
    }
  }

  return typeof value === 'string' ? value : key;
};

// i18nミドルウェア
export default (req: Request, res: Response, next: NextFunction): void => {
  // 言語をクッキーから取得（デフォルトは英語）
  const lang = req.cookies.language || 'en';
  
  // Express.Responseオブジェクトに翻訳関数を追加
  res.locals.__ = (key: string) => translate(lang, key);
  res.locals.language = lang; // 現在の言語をテンプレートに渡す
  
  next();
};