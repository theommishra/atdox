'use client'
import { AuthPage } from "../../components/AuthPage";
import { useEffect, useState } from 'react';

export default function Signin() {
    return <AuthPage isSignin={false} />
}