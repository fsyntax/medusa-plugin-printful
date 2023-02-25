"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _medusa = require("@medusajs/medusa");
var _printfulRequest = require("printful-request");
var _lodash = require("lodash");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
// TODO: move to env
var PRINTFUL_ACCESS_TOKEN = "HhN1J8dFDwT4XxUolNUF5xQERHppnLy3fTWRitQA";
var PRINTFUL_STORE_ID = "9893380";
var PrintfulService = /*#__PURE__*/function (_TransactionBaseServi) {
  (0, _inherits2["default"])(PrintfulService, _TransactionBaseServi);
  var _super = _createSuper(PrintfulService);
  function PrintfulService(container, options) {
    var _this;
    (0, _classCallCheck2["default"])(this, PrintfulService);
    _this = _super.call(this, container);
    _this.productService = container.productService;
    _this.productVariantService = container.productVariantService;
    _this.shippingProfileService = container.shippingProfileService;
    _this.salesChannelService = container.salesChannelService;
    _this.printfulClient = new _printfulRequest.PrintfulClient(PRINTFUL_ACCESS_TOKEN);
    _this.storeId = PRINTFUL_STORE_ID;
    return _this;
  }
  (0, _createClass2["default"])(PrintfulService, [{
    key: "getScopes",
    value: function () {
      var _getScopes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var scopes;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.printfulClient.get("oauth/scopes");
            case 2:
              scopes = _context.sent;
              return _context.abrupt("return", scopes);
            case 4:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function getScopes() {
        return _getScopes.apply(this, arguments);
      }
      return getScopes;
    }()
  }, {
    key: "syncPrintfulProducts",
    value: function () {
      var _syncPrintfulProducts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var products, _yield$this$printfulC, availableProducts, _iterator, _step, _product, _yield$this$printfulC2, _yield$this$printfulC3, sync_product, sync_variants, builtProduct, _iterator2, _step2, product, existingProduct, productObj, variantsObj, _iterator3, _step3, variant, defaultShippingProfile, defaultSalesChannel, _productObj, productVariantsObj, productToPush;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              // TODO: Add store id to env
              products = [];
              _context2.next = 3;
              return this.printfulClient.get("store/products", {
                store_id: this.storeId
              });
            case 3:
              _yield$this$printfulC = _context2.sent;
              availableProducts = _yield$this$printfulC.result;
              _iterator = _createForOfIteratorHelper(availableProducts);
              _context2.prev = 6;
              _iterator.s();
            case 8:
              if ((_step = _iterator.n()).done) {
                _context2.next = 20;
                break;
              }
              _product = _step.value;
              _context2.next = 12;
              return this.printfulClient.get("sync/products/".concat(_product.id), {
                store_id: this.storeId
              });
            case 12:
              _yield$this$printfulC2 = _context2.sent;
              _yield$this$printfulC3 = _yield$this$printfulC2.result;
              sync_product = _yield$this$printfulC3.sync_product;
              sync_variants = _yield$this$printfulC3.sync_variants;
              builtProduct = _objectSpread(_objectSpread({}, sync_product), {}, {
                variants: sync_variants
              });
              products.push(builtProduct);
            case 18:
              _context2.next = 8;
              break;
            case 20:
              _context2.next = 25;
              break;
            case 22:
              _context2.prev = 22;
              _context2.t0 = _context2["catch"](6);
              _iterator.e(_context2.t0);
            case 25:
              _context2.prev = 25;
              _iterator.f();
              return _context2.finish(25);
            case 28:
              if (!(products.length > 0)) {
                _context2.next = 89;
                break;
              }
              _iterator2 = _createForOfIteratorHelper(products);
              _context2.prev = 30;
              _iterator2.s();
            case 32:
              if ((_step2 = _iterator2.n()).done) {
                _context2.next = 81;
                break;
              }
              product = _step2.value;
              _context2.next = 36;
              return this.checkIfProductExists(product.id);
            case 36:
              existingProduct = _context2.sent;
              if (!existingProduct) {
                _context2.next = 61;
                break;
              }
              // build the product object according to UpdateProductInput type
              productObj = {
                title: product.name,
                thumbnail: product.thumbnail_url
              };
              _context2.next = 41;
              return this.productService.update(existingProduct.id, productObj);
            case 41:
              variantsObj = product.variants.map(function (variant) {
                return {
                  sku: variant.sku,
                  data: {
                    title: variant.name,
                    sku: variant.sku
                    // options: {value: variant.id},
                  }
                };
              });
              _iterator3 = _createForOfIteratorHelper(variantsObj);
              _context2.prev = 43;
              _iterator3.s();
            case 45:
              if ((_step3 = _iterator3.n()).done) {
                _context2.next = 51;
                break;
              }
              variant = _step3.value;
              _context2.next = 49;
              return this.updateVariantInMedusa(variant.sku, variant.data);
            case 49:
              _context2.next = 45;
              break;
            case 51:
              _context2.next = 56;
              break;
            case 53:
              _context2.prev = 53;
              _context2.t1 = _context2["catch"](43);
              _iterator3.e(_context2.t1);
            case 56:
              _context2.prev = 56;
              _iterator3.f();
              return _context2.finish(56);
            case 59:
              _context2.next = 79;
              break;
            case 61:
              _context2.next = 63;
              return this.shippingProfileService.retrieveDefault();
            case 63:
              defaultShippingProfile = _context2.sent;
              _context2.next = 66;
              return this.salesChannelService.retrieveDefault();
            case 66:
              defaultSalesChannel = _context2.sent;
              // build the product object according to CreateProductInput type
              console.log(defaultSalesChannel);
              _productObj = {
                title: product.name,
                handle: (0, _lodash.kebabCase)(product.name),
                thumbnail: product.thumbnail_url,
                options: [{
                  title: "Printful Variant"
                }],
                profile_id: defaultShippingProfile.id,
                external_id: product.id,
                sales_channels: [{
                  id: defaultSalesChannel.id
                }],
                metadata: {
                  printful_id: product.id
                }
              }; // TODO: add ts typings
              productVariantsObj = product.variants.map(function (variant) {
                return {
                  title: variant.name,
                  sku: variant.sku,
                  external_id: variant.id,
                  options: {
                    value: variant.id
                  },
                  manage_inventory: false,
                  allow_backorder: true,
                  inventory_quantity: 100,
                  // prices: [{amount: parseInt(variant.retail_price, 10) * 100, currency_code: variant.currency}],
                  metadata: {
                    printful_id: variant.id
                  }
                };
              });
              productToPush = _objectSpread(_objectSpread({}, _productObj), {}, {
                variants: productVariantsObj
              });
              _context2.prev = 71;
              _context2.next = 74;
              return this.createProductInMedusa(productToPush);
            case 74:
              _context2.next = 79;
              break;
            case 76:
              _context2.prev = 76;
              _context2.t2 = _context2["catch"](71);
              console.log(_context2.t2);
            case 79:
              _context2.next = 32;
              break;
            case 81:
              _context2.next = 86;
              break;
            case 83:
              _context2.prev = 83;
              _context2.t3 = _context2["catch"](30);
              _iterator2.e(_context2.t3);
            case 86:
              _context2.prev = 86;
              _iterator2.f();
              return _context2.finish(86);
            case 89:
              return _context2.abrupt("return", this.productService.list({
                q: ''
              }));
            case 90:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[6, 22, 25, 28], [30, 83, 86, 89], [43, 53, 56, 59], [71, 76]]);
      }));
      function syncPrintfulProducts() {
        return _syncPrintfulProducts.apply(this, arguments);
      }
      return syncPrintfulProducts;
    }()
  }, {
    key: "checkIfProductExists",
    value: function () {
      var _checkIfProductExists = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(id) {
        var product;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.productService.list({
                external_id: id
              });
            case 2:
              product = _context3.sent;
              if (!(product.length > 0)) {
                _context3.next = 5;
                break;
              }
              return _context3.abrupt("return", product[0]);
            case 5:
              return _context3.abrupt("return", false);
            case 6:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function checkIfProductExists(_x) {
        return _checkIfProductExists.apply(this, arguments);
      }
      return checkIfProductExists;
    }()
  }, {
    key: "createProductInMedusa",
    value: function () {
      var _createProductInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(product) {
        var createdProduct;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.productService.create(product);
            case 2:
              createdProduct = _context4.sent;
              console.log("Successfully created product ".concat(createdProduct.title, " in Medusa"));
              return _context4.abrupt("return", createdProduct);
            case 5:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function createProductInMedusa(_x2) {
        return _createProductInMedusa.apply(this, arguments);
      }
      return createProductInMedusa;
    }()
  }, {
    key: "updateProductInMedusa",
    value: function () {
      var _updateProductInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(productOrProductId, product) {
        var updatedProduct;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return this.productService.update(productOrProductId, product);
            case 2:
              updatedProduct = _context5.sent;
              console.log("Successfully updated product ".concat(updatedProduct.title, " in Medusa"));
              return _context5.abrupt("return", updatedProduct);
            case 5:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
      function updateProductInMedusa(_x3, _x4) {
        return _updateProductInMedusa.apply(this, arguments);
      }
      return updateProductInMedusa;
    }()
  }, {
    key: "createVariantInMedusa",
    value: function () {
      var _createVariantInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(productOrProductId, variant) {
        var createdVariant;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return this.productVariantService.create(productOrProductId, variant);
            case 2:
              createdVariant = _context6.sent;
              console.log("Successfully created variant ".concat(createdVariant.title, " in Medusa"));
              return _context6.abrupt("return", createdVariant);
            case 5:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));
      function createVariantInMedusa(_x5, _x6) {
        return _createVariantInMedusa.apply(this, arguments);
      }
      return createVariantInMedusa;
    }()
  }, {
    key: "updateVariantInMedusa",
    value: function () {
      var _updateVariantInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(variantSku, update) {
        var variant, updatedVariant;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return this.productVariantService.retrieveBySKU(variantSku);
            case 2:
              variant = _context7.sent;
              _context7.next = 5;
              return this.productVariantService.update(variant.id, update);
            case 5:
              updatedVariant = _context7.sent;
              if (updatedVariant) {
                console.log("Successfully updated variant ".concat(updatedVariant.title, " in Medusa"));
              } else {
                console.log("Failed to update variant ".concat(variant.title, " in Medusa"));
              }
            case 7:
            case "end":
              return _context7.stop();
          }
        }, _callee7, this);
      }));
      function updateVariantInMedusa(_x7, _x8) {
        return _updateVariantInMedusa.apply(this, arguments);
      }
      return updateVariantInMedusa;
    }()
  }, {
    key: "updateVariantOptionValueInMedusa",
    value: function () {
      var _updateVariantOptionValueInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(variantId, optionId, optionValue) {
        var updatedVariant;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.productVariantService.updateOptionValue(variantId, optionId, optionValue);
            case 2:
              updatedVariant = _context8.sent;
              return _context8.abrupt("return", updatedVariant);
            case 4:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this);
      }));
      function updateVariantOptionValueInMedusa(_x9, _x10, _x11) {
        return _updateVariantOptionValueInMedusa.apply(this, arguments);
      }
      return updateVariantOptionValueInMedusa;
    }()
  }, {
    key: "updateVariantPricesInMedusa",
    value: function () {
      var _updateVariantPricesInMedusa = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(variantId, prices) {
        var updatedVariant;
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return this.productVariantService.updatePrices(variantId, prices);
            case 2:
              updatedVariant = _context9.sent;
              return _context9.abrupt("return", updatedVariant);
            case 4:
            case "end":
              return _context9.stop();
          }
        }, _callee9, this);
      }));
      function updateVariantPricesInMedusa(_x12, _x13) {
        return _updateVariantPricesInMedusa.apply(this, arguments);
      }
      return updateVariantPricesInMedusa;
    }()
  }]);
  return PrintfulService;
}(_medusa.TransactionBaseService);
var _default = PrintfulService;
exports["default"] = _default;