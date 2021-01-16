"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const graphEditor_1 = require("./graphEditor");
// import { ENViewerProvider } from './effectNo';
function activate(context) {
    // Register our custom editor providers
    context.subscriptions.push(graphEditor_1.GraphEditorProvider.register(context));
    // context.subscriptions.push(ENViewerProvider.register(context));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map