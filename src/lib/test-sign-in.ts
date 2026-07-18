export function testSignInEnabled(): boolean {
  return process.env.ENABLE_TEST_SIGNIN === "1";
}