'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function DashboardTour() {
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');

    if (!hasSeenTour) {
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;

        const desktopSteps: DriveStep[] = [
          {
            element: '#tour-welcome',
            popover: {
              title: 'Välkommen till Tippwits!',
              description:
                'Låt oss ta en snabb titt på hur allt fungerar så du kan börja tippa.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-nav-bets',
            popover: {
              title: 'Dina Tips',
              description:
                'Här lägger du alla dina tips för matcherna och slutspelet. Du kan tippa hela gruppspelet på gång, men kan ändra dig fram till 1h innan matchstart!',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-nav-leagues',
            popover: {
              title: 'Ligor',
              description:
                'Tippa fotboll är roligast i sällskap. Här kan du skapa och delta i grupper.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-upcoming',
            popover: {
              title: 'Håll koll på schemat',
              description:
                'Här ser du alltid de närmaste matcherna. En match låses en timme innan avspark, så se till att dina tips är inne!',
              side: 'top',
              align: 'center',
            },
          },
        ];

        const mobileSteps: DriveStep[] = [
          {
            element: '#tour-welcome',
            popover: {
              title: 'Välkommen till Tippwits! 👋',
              description:
                'Låt oss ta en snabb titt på hur allt fungerar på mobilen.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            popover: {
              title: 'Mina Tips 📝',
              description:
                'Genom att klicka på menyknappen (☰) högst upp till höger hittar du "Mina Tips". Där lägger du alla dina tips för matcherna och slutspelet fram till 1h innan avspark.',
            },
          },
          {
            popover: {
              title: 'Ligor 🏆',
              description:
                'I samma meny hittar du också "Ligor". Det är där du kan skapa eller gå med i privata grupper för att utmana dina vänner, kollegorna eller familjen.',
            },
          },
          {
            element: '#tour-upcoming',
            popover: {
              title: 'Håll koll på schemat 📅',
              description:
                'Här direkt på startsidan ser du alltid de närmaste matcherna. Missa inte att få in dina tips i tid!',
              side: 'top',
              align: 'center',
            },
          },
        ];

        const driverObj = driver({
          showProgress: true,
          nextBtnText: 'Nästa &rarr;',
          prevBtnText: '&larr; Tillbaka',
          doneBtnText: 'Nu kör vi!',
          progressText: 'Steg {{current}} av {{total}}',
          popoverClass: 'tour-popover',
          steps: isMobile ? mobileSteps : desktopSteps,
          onDestroyStarted: () => {
            localStorage.setItem('hasSeenDashboardTour', 'true');
            driverObj.destroy();
          },
        });

        driverObj.drive();
      }, 500);
    }
  }, []);

  return null;
}
