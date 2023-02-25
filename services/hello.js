"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _medusa = require("@medusajs/medusa");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var HelloService = /*#__PURE__*/function (_TransactionBaseServi) {
  (0, _inherits2["default"])(HelloService, _TransactionBaseServi);
  var _super = _createSuper(HelloService);
  function HelloService(options, container) {
    var _this;
    (0, _classCallCheck2["default"])(this, HelloService);
    _this = _super.call(this, container);
    _this.productService = container.productService;
    return _this;
  }
  (0, _createClass2["default"])(HelloService, [{
    key: "sayHello",
    value: function () {
      var _sayHello = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", "Hello there!");
            case 1:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      function sayHello() {
        return _sayHello.apply(this, arguments);
      }
      return sayHello;
    }()
  }, {
    key: "getProductsCount",
    value: function () {
      var _getProductsCount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var count;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.productService.count();
            case 2:
              count = _context2.sent;
              return _context2.abrupt("return", count);
            case 4:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function getProductsCount() {
        return _getProductsCount.apply(this, arguments);
      }
      return getProductsCount;
    }()
  }]);
  return HelloService;
}(_medusa.TransactionBaseService);
var _default = HelloService;
exports["default"] = _default;