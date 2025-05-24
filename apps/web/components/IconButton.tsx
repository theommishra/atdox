import { ReactNode } from "react";

export function IconButton({
    icon, onClick
}: {
    icon: String,
    onClick: () => void,
}) {
    return <button className={'m-2 px-3 py-2 border-2 rounded-xl border-black hover:bg-amber-200'} onClick={onClick}>
        {icon}
    </button>
}