'use client';

import React from 'react';
import { auth } from '@/shared/api/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { GalleryVerticalEnd } from "lucide-react"
import { Button } from "@/shared/ui/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/ui/card"

/**
 * Landing and Authentication page.
 * Provides a "Sign in with Google" flow and high-level marketing for the app.
 *
 * @component
 */
const LoginView = () => {
    /**
     * Triggers the Firebase Google OAuth popup.
     */
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In failed", error);
        }
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/40">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                    <GalleryVerticalEnd className="size-6" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Welcome to Taskweave</CardTitle>
                            <CardDescription>
                                A holistic productivity and wellness companion
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="flex flex-col gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full py-6 flex items-center justify-center gap-3 transition-all"
                                        onClick={handleGoogleSignIn}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5">
                                            <path
                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.162-1.908 4.162-1.148 1.148-2.568 1.908-4.162 1.908-4.24 0-7.64-3.44-7.64-7.64s3.44-7.64 7.64-7.64c2.24 0 4.12.84 5.56 2.24l2.32-2.32C19.8 1.36 17.2 0 14.4 0 8.08 0 3 5.08 3 11.4s5.08 11.4 11.4 11.4c3.48 0 6.12-1.12 8.16-3.24 2.08-2.08 2.72-4.96 2.72-7.32 0-.72-.04-1.4-.12-2.08h-12.72z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="font-semibold">Login with Google</span>
                                    </Button>
                                </div>
                                <div className="text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                                    By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
