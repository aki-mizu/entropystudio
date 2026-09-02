export type DiceColors = {
  readonly accent: string;
  readonly background: string;
  readonly border: string;
  readonly diceBorder: string;
  readonly diceSurface: string;
  readonly diceText: string;
  readonly error: string;
  readonly muted: string;
  readonly onAccent: string;
  readonly placeholder: string;
  readonly segment: string;
  readonly surface: string;
  readonly text: string;
};

const lightColors: DiceColors = {
  accent: '#006B54',
  background: '#F4F6F1',
  border: '#CBD4CB',
  diceBorder: '#D37457',
  diceSurface: '#FFF6F1',
  diceText: '#A23417',
  error: '#B42318',
  muted: '#53645B',
  onAccent: '#FFFFFF',
  placeholder: '#7A8B80',
  segment: '#E8EEE8',
  surface: '#FFFFFF',
  text: '#17231B',
};

const darkColors: DiceColors = {
  accent: '#66D7AF',
  background: '#102019',
  border: '#355344',
  diceBorder: '#9A5848',
  diceSurface: '#321F1A',
  diceText: '#FFB39D',
  error: '#FFB4AB',
  muted: '#B1C5B8',
  onAccent: '#102019',
  placeholder: '#839A8C',
  segment: '#21382B',
  surface: '#182B21',
  text: '#E6F2E8',
};

export function diceColors(isDarkMode: boolean): DiceColors {
  return isDarkMode ? darkColors : lightColors;
}