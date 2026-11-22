"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ui/AuthProvider";
import { useTranslation } from "react-i18next";
import styles from "./layout.module.css";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const userName = user?.user_metadata?.nombre || user?.email?.split("@")[0] || t("common.name");

  return (
    <header className={styles.navbar}>
      <h1 className={styles.navbarTitle}>{title}</h1>
      <div className={styles.navbarUser}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={styles.userButton}
        >
          <div className={styles.userAvatar}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className={styles.userName}>{userName}</span>
        </button>
        {showMenu && (
          <div className={styles.dropdown}>
            <button
              onClick={handleLogout}
              className={styles.dropdownItem}
            >
              {t("auth.logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
