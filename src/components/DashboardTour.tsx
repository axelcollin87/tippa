'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function DashboardTour() {
  useEffect(() => {
    // Kolla om användaren redan har sett turen
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    
    if (!hasSeenTour) {
      // Ge gränssnittet en halv sekund att rendera klart innan turen startar
      setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          nextBtnText: 'Nästa &rarr;',
          prevBtnText: '&larr; Tillbaka',
          doneBtnText: 'Nu kör vi!',
          progressText: 'Steg {{current}} av {{total}}',
          popoverClass: 'tour-popover',
          steps: [
            {
              element: '#tour-welcome',
              popover: {
                title: 'Välkommen till Tippwits!',
                description: 'Här är din dashboard. Låt oss ta en snabb titt på hur allt fungerar så du kan börja tippa och krossa dina vänner.',
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-bets',
              popover: {
                title: 'Dina Tips',
                description: 'Här lägger du alla dina tips för matcherna och slutspelet. Glöm inte att tippa hela gruppspelet i förväg!',
                side: 'bottom',
                align: 'center'
              }
            },
            {
              element: '#tour-nav-leagues',
              popover: {
                title: 'Ligor & Trashtalk',
                description: 'Tippa Fotboll är roligast med vänner. Här kan du skapa privata grupper och få tillgång till den magiska trashtalk-chatten.',
                side: 'bottom',
                align: 'center'
              }
            },
            {
              element: '#tour-upcoming',
              popover: {
                title: 'Håll koll på schemat',
                description: 'Här ser du alltid de närmaste matcherna. En match låses en timme innan avspark, så se till att dina tips är inne!',
                side: 'top',
                align: 'center'
              }
            }
          ],
          onDestroyStarted: () => {
            // Sätt flaggan i localStorage så de slipper se den igen
            localStorage.setItem('hasSeenDashboardTour', 'true');
            driverObj.destroy();
          }
        });

        driverObj.drive();
      }, 500);
    }
  }, []);

  // Returnera null eftersom denna komponent bara hanterar logik och sid-effekter
  return null;
}
