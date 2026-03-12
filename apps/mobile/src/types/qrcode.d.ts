declare module 'qrcode' {
  const qrcode: {
    toDataURL(
      input: string,
      options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
    ): Promise<string>;
  };
  export default qrcode;
}
