/**
 * Мок next/link для тестов.
 * Рендерит обычный <a> без роутера Next.js.
 */
const React = require("react");

function MockLink({ children, href, ...rest }) {
  return React.createElement("a", { href, ...rest }, children);
}

MockLink.displayName = "MockNextLink";

module.exports = MockLink;
module.exports.default = MockLink;
