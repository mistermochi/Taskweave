'use client';

import React from 'react';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const LoginView = () => {
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In failed", error);
            // Optionally show an error to the user
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background text-foreground p-8">
            <div className="w-full max-w-sm text-center">
                <div className="flex justify-center mb-6">
                     <div className="relative w-20 h-20">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <img src="/logo.svg" alt="Taskweave Logo" width={80} height={80} className="relative" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                    Welcome to Taskweave
                </h1>
                <p className="text-base text-secondary mb-10 max-w-xs mx-auto">
                    A holistic productivity and wellness companion.
                </p>

                <button
                    onClick={handleGoogleSignIn}
                    className="w-full bg-foreground/10 border border-foreground/10 hover:bg-foreground/20 text-foreground font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google logo" className="w-5 h-5"/>
                    <span>Sign in with Google</span>
                </button>

                <p className="text-xs text-secondary/40 mt-12">
                    By signing in, you agree to our non-existent Terms of Service.
                </p>
            </div>
        </div>
    );
};

export default LoginView;
