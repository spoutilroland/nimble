'use client';

import { useEffect, useRef, useState } from 'react';

export function NavBurger() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    navRef.current = document.getElementById('main-nav');

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        burgerRef.current &&
        navRef.current &&
        !burgerRef.current.contains(target) &&
        !navRef.current.contains(target)
      ) {
        setOpen(false);
        navRef.current.classList.remove('nav-open');
        burgerRef.current.classList.remove('burger-active');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (navRef.current) {
      navRef.current.classList.toggle('nav-open', next);
    }
    if (burgerRef.current) {
      burgerRef.current.classList.toggle('burger-active', next);
    }
  };

  return (
    <button
      ref={burgerRef}
      className="nav-burger"
      id="nav-burger"
      aria-label="Menu"
      aria-expanded={open}
      onClick={toggle}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}
