"use client";
import React, { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Loader from "@/components/Loader";
import Library from "@/components/Library";
import { Song } from "@/types";

interface AccountContentProps {
    songs: Song[];
}

const AccountContent: FC<AccountContentProps> = ({ songs }) => {
    const router = useRouter();
    const { isLoading, user } = useUser();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return <Loader />;
    }

    return (
        <main className="mb-7 px-6 xsm:px-2 flex flex-col xsm:items-center gap-y-6">
            <div className="flex flex-col gap-y-4">
                <h2 className="text-white">E-mail: <span>{user?.email}</span></h2>
            </div>
            <Library songs={songs} />
        </main>
    );
};

export default AccountContent;
