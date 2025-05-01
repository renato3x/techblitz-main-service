export type Claims = {
  [key: string]: any;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
};
