declare module 'express-session' {
    import { Request } from 'express';
    
    interface SessionData {
        [key: string]: any;
    }
    
    interface Session {
        [key: string]: any;
    }
    
    interface Request {
        session: Session & Partial<SessionData>;
        user?: any;
    }
}

declare module 'passport' {
    import { Request, Response, NextFunction } from 'express';
    
    interface AuthenticateOptions {
        scope?: string | string[];
        failureRedirect?: string;
    }
    
    interface Passport {
        initialize(): any;
        session(): any;
        authenticate(strategy: string, options?: AuthenticateOptions): any;
        use(strategy: any): any;
        serializeUser(fn: (user: any, done: any) => void): void;
        deserializeUser(fn: (user: any, done: any) => void): void;
    }
    
    const passport: Passport;
    export = passport;
}

declare module 'passport-google-oauth20' {
    import { Strategy } from 'passport';
    
    interface GoogleStrategyOptions {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
    }
    
    interface GoogleStrategyVerifyFunction {
        (accessToken: string, refreshToken: string, profile: any, done: any): void;
    }
    
    class GoogleStrategy extends Strategy {
        constructor(options: GoogleStrategyOptions, verify: GoogleStrategyVerifyFunction);
    }
    
    export { GoogleStrategy };
    export { Strategy };
}
