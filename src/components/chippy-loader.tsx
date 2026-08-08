import styled from 'styled-components';
import imgSrc from 'assets/images/kapibara_600.png';
import {Theme} from 'src/utils/themes';
import {getDarkenedColor} from 'src/utils/color-math';
import {getSelectedTheme} from 'src/store/settingsSlice';
import {useAppSelector} from 'src/store/hooks';

const defaultChippy = {
  width: 300,
  height: 300,
  src: imgSrc,
};

const LoaderContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CircleContainer = styled.div<{
  $containerHeight: number;
  $containerWidth: number;
  $progress: number | null;
  $progressColor: string;
}>`
  border-radius: 50%;
  background-color: var(--bg_icon);
  height: ${(props) => props.$containerHeight}px;
  width: ${(props) => props.$containerWidth}px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  animation-duration: 1.5s;
  animation-name: roll;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;

  &::after {
    height: ${(props) => props.$containerHeight}px;
    width: ${(props) => props.$containerWidth}px;
    position: absolute;
    content: '';
    background-color: ${(p) => p.$progressColor};
    top: ${(props) => props.$containerHeight + 1}px;
    left: 0;
    right: 0;
    z-index: 2;
    opacity: 0.45;
    pointer-events: none;
    transition: transform 0.4s ease-out;
    transform: translate3d(
      0,
      ${(props) => -(props.$progress || 0) * props.$containerHeight}px,
      0
    );
  }
`;

const Avatar = styled.img`
  display: block;
  border-radius: 50%;
  position: relative;
  z-index: 1;
  user-select: none;
  -webkit-user-drag: none;
`;

type Props = {
  progress: number | null;
  width?: number;
  height?: number;
  theme: Theme;
};

export default function ChippyLoader(props: Props) {
  const width = props.width || defaultChippy.width;
  const height = props.height || defaultChippy.height;
  // 头像本身即圆形，直接铺满容器，进度色作为半透明遮罩自下而上覆盖
  const [containerHeight, containerWidth] = [height, width];
  const selectedTheme = useAppSelector(getSelectedTheme);

  return (
    <LoaderContainer>
      <CircleContainer
        $progress={props.progress}
        $progressColor={getDarkenedColor(selectedTheme.accent.c, 0.9)}
        $containerHeight={containerHeight}
        $containerWidth={containerWidth}
      >
        <Avatar
          src={defaultChippy.src}
          width={width}
          height={height}
          alt=""
          draggable={false}
        />
      </CircleContainer>
    </LoaderContainer>
  );
}
