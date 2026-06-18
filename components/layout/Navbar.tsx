"use client";

import styles from "./layout.module.css";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <h1 className={styles.navbarTitle}>{title}</h1>
      <div className={styles.navbarUser}>
        <div className={styles.userAvatar}>U</div>
        <span className={styles.userName}>Usuario</span>
      </div>
    </header>
  );
}