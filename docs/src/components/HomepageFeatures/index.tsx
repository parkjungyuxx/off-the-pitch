import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  link: string;
  linkText: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: '@bongsik/infinite-scroll',
    description: (
      <>
        Intersection Observer API를 활용한 고성능 무한 스크롤 훅입니다. 
        데이터 페칭 로직과 완전히 분리되어 어떤 상태 관리 라이브러리와도 함께 사용할 수 있으며, 
        타입 안전성과 경량화를 제공합니다.
      </>
    ),
    link: '/docs/infinite-scroll/intro',
    linkText: '문서 보기 →',
  },
  {
    title: '@bongsik/virtual-list',
    description: (
      <>
        대량의 데이터를 효율적으로 렌더링하는 가상화 리스트 훅입니다. 
        ResizeObserver를 활용하여 동적 높이 아이템을 자동으로 측정하고, 
        뷰포트에 보이는 아이템만 렌더링하여 성능을 최적화합니다.
      </>
    ),
    link: '/docs/virtual-list/intro',
    linkText: '문서 보기 →',
  },
];

function Feature({title, description, link, linkText}: FeatureItem) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureCardContent}>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
        <Link to={link} className={styles.featureLink}>
          {linkText}
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className={styles.featuresContainer}>
        {FeatureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </section>
  );
}
