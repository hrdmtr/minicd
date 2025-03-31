declare module 'i18n-express' {
  import { RequestHandler } from 'express';

  interface I18nOptions {
    translationsPath: string;
    siteLangs: string[];
    textsVarName: string;
    cookieLangName?: string;
    browserEnable?: boolean;
    defaultLang?: string;
    paramLangName?: string;
    forceLang?: string;
  }

  function i18n(options: I18nOptions): RequestHandler;
  
  export default i18n;
}