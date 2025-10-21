import { useState, useEffect } from 'react';
import styles from '../styles/LoginPage.module.css';

import show1 from '../assets/show1.jpg';
import show2 from '../assets/show2.jpg';
import show3 from '../assets/show3.jpg';
import show4 from '../assets/show4.jpg';
import show5 from '../assets/show5.jpg';
import show6 from '../assets/show6.jpg';

const LoginSidePanel: React.FC = () => {
  const [images, setImages] = useState([show1, show2, show3]);
  const [fade, setFade] = useState([false, false, false]);

  useEffect(() => {
    const pairs = [
      [show1, show4],
      [show2, show5],
      [show3, show6],
    ];
    const timers: NodeJS.Timeout[] = [];

    pairs.forEach(([imgA, imgB], index) => {
      const delay = (index + 1) * 500;
      let toggle = false;

      const cycle = () => {
        setFade(prev => {
          const newFade = [...prev];
          newFade[index] = true;
          return newFade;
        });

        const t1 = setTimeout(() => {
          setImages(prev => {
            const newImages = [...prev];
            newImages[index] = toggle ? imgA : imgB;
            return newImages;
          });

          setFade(prev => {
            const newFade = [...prev];
            newFade[index] = false;
            return newFade;
          });

          toggle = !toggle;
          const t2 = setTimeout(cycle, 4000);
          timers.push(t2);
        }, 1000);

        timers.push(t1);
      };

      const starter = setTimeout(cycle, delay);
      timers.push(starter);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className='loginside'>
      <img src={images[0]} alt="幻灯片1" id="show1" className={`${styles.sample} ${styles.fadeImg} ${fade[0] ? styles.fadeOut : ''}`} />
      <img src={images[1]} alt="幻灯片2" id="show2" className={`${styles.sample} ${styles.fadeImg} ${fade[1] ? styles.fadeOut : ''}`} />
      <img src={images[2]} alt="幻灯片3" id="show3" className={`${styles.sample} ${styles.fadeImg} ${fade[2] ? styles.fadeOut : ''}`} />
    </div>
  );
};

export default LoginSidePanel;