import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '@bongsik/infinite-scroll',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Intersection Observer API를 활용한 고성능 무한 스크롤 훅입니다. 
        데이터 페칭 로직과 완전히 분리되어 어떤 상태 관리 라이브러리와도 함께 사용할 수 있으며, 
        타입 안전성과 경량화를 제공합니다.
      </>
    ),
  },
  {
    title: '@bongsik/virtual-list',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        대량의 데이터를 효율적으로 렌더링하는 가상화 리스트 훅입니다. 
        ResizeObserver를 활용하여 동적 높이 아이템을 자동으로 측정하고, 
        뷰포트에 보이는 아이템만 렌더링하여 성능을 최적화합니다.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
