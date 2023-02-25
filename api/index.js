"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _express = require("express");
var _default = function _default() {
  var router = (0, _express.Router)();
  router.get("/", /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            res.json({
              message: "Hello Medusa!"
            });
          case 1:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
  router.get("/hello-product", /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
      var printfulService, productService;
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            printfulService = req.scope.resolve("printfulService");
            productService = req.scope.resolve("productService");
            _context2.t0 = res;
            _context2.next = 5;
            return printfulService.syncPrintfulProducts();
          case 5:
            _context2.t1 = _context2.sent;
            _context2.t2 = {
              products: _context2.t1
            };
            _context2.t0.json.call(_context2.t0, _context2.t2);
          case 8:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());
  return router;
};
exports["default"] = _default;