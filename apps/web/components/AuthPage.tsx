"use client";

export function AuthPage({isSignin}:{
    isSignin: boolean
}){
    return <div className="w-screen h-screen flex justify-center items-center text-white">
        <div className="p-6 m-2 bg-black rounded">
            <div className="p-2">
            <input type="text" placeholder="Email" />
            </div >
            <div className="p-2">
            <input type="password" placeholder="Password" />
            </div>
            <div className="p-2">
            <button onClick={()=>{}}>{isSignin ? "Sign in": "Sign Up"}</button>
            </div>
        </div>
    </div>
}