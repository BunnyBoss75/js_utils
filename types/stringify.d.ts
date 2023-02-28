type objectKey = string|symbol;

type replacer = (key: objectKey, value: any) => ({key: objectKey, value: any});
type comparator = (a: objectKey, b: objectKey) => number;

interface options {
  replacer?: replacer,
  comparator?: comparator|boolean,
  newLine?: boolean,
  indent?: number,
  keyValueIndent?: number,
  ignoreCycles?: boolean,
  ignoreSymbols?: boolean,
}

interface defaultOptions extends options {
  replacer: null,
  comparator: true,
  newLine: false,
  indent: 0,
  keyValueIndent: 0,
  ignoreCycles: true,
  ignoreSymbols: false,
}
export declare function stringify (value: any, options?: options): string;
export declare namespace stringify {
  export const defaultOptions: defaultOptions;
}
