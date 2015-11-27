/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatibility with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokens.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokens.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(params, kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, false);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey(params, kind);
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        }
        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
            case 'let':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var list = [];

        do {
            list.push(parseVariableDeclaration({ inFor: options.inFor }));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [];

        do {
            list.push(parseLexicalBinding(kind, options));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                state.allowIn = false;
                declarations = parseBindingList(kind, {inFor: true});
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    consumeSemicolon();
                    init = init.finishLexicalDeclaration(declarations, kind);
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesisCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesisCount;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.6.0';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(global) {
  'use strict';

  var testingExposeCycleCount = global.testingExposeCycleCount;

  // Detect and do basic sanity checking on Object/Array.observe.
  function detectObjectObserve() {
    if (typeof Object.observe !== 'function' ||
        typeof Array.observe !== 'function') {
      return false;
    }

    var records = [];

    function callback(recs) {
      records = recs;
    }

    var test = {};
    var arr = [];
    Object.observe(test, callback);
    Array.observe(arr, callback);
    test.id = 1;
    test.id = 2;
    delete test.id;
    arr.push(1, 2);
    arr.length = 0;

    Object.deliverChangeRecords(callback);
    if (records.length !== 5)
      return false;

    if (records[0].type != 'add' ||
        records[1].type != 'update' ||
        records[2].type != 'delete' ||
        records[3].type != 'splice' ||
        records[4].type != 'splice') {
      return false;
    }

    Object.unobserve(test, callback);
    Array.unobserve(arr, callback);

    return true;
  }

  var hasObserve = detectObjectObserve();

  function detectEval() {
    // Don't test for eval if we're running in a Chrome App environment.
    // We check for APIs set that only exist in a Chrome App context.
    if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
      return false;
    }

    // Firefox OS Apps do not allow eval. This feature detection is very hacky
    // but even if some other platform adds support for this function this code
    // will continue to work.
    if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
      return false;
    }

    try {
      var f = new Function('', 'return true;');
      return f();
    } catch (ex) {
      return false;
    }
  }

  var hasEval = detectEval();

  function isIndex(s) {
    return +s === s >>> 0 && s !== '';
  }

  function toNumber(s) {
    return +s;
  }

  function isObject(obj) {
    return obj === Object(obj);
  }

  var numberIsNaN = global.Number.isNaN || function(value) {
    return typeof value === 'number' && global.isNaN(value);
  }

  function areSameValue(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    if (numberIsNaN(left) && numberIsNaN(right))
      return true;

    return left !== left && right !== right;
  }

  var createObject = ('__proto__' in {}) ?
    function(obj) { return obj; } :
    function(obj) {
      var proto = obj.__proto__;
      if (!proto)
        return obj;
      var newObject = Object.create(proto);
      Object.getOwnPropertyNames(obj).forEach(function(name) {
        Object.defineProperty(newObject, name,
                             Object.getOwnPropertyDescriptor(obj, name));
      });
      return newObject;
    };

  var identStart = '[\$_a-zA-Z]';
  var identPart = '[\$_a-zA-Z0-9]';
  var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

  function getPathCharType(char) {
    if (char === undefined)
      return 'eof';

    var code = char.charCodeAt(0);

    switch(code) {
      case 0x5B: // [
      case 0x5D: // ]
      case 0x2E: // .
      case 0x22: // "
      case 0x27: // '
      case 0x30: // 0
        return char;

      case 0x5F: // _
      case 0x24: // $
        return 'ident';

      case 0x20: // Space
      case 0x09: // Tab
      case 0x0A: // Newline
      case 0x0D: // Return
      case 0xA0:  // No-break space
      case 0xFEFF:  // Byte Order Mark
      case 0x2028:  // Line Separator
      case 0x2029:  // Paragraph Separator
        return 'ws';
    }

    // a-z, A-Z
    if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
      return 'ident';

    // 1-9
    if (0x31 <= code && code <= 0x39)
      return 'number';

    return 'else';
  }

  var pathStateMachine = {
    'beforePath': {
      'ws': ['beforePath'],
      'ident': ['inIdent', 'append'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'inPath': {
      'ws': ['inPath'],
      '.': ['beforeIdent'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'beforeIdent': {
      'ws': ['beforeIdent'],
      'ident': ['inIdent', 'append']
    },

    'inIdent': {
      'ident': ['inIdent', 'append'],
      '0': ['inIdent', 'append'],
      'number': ['inIdent', 'append'],
      'ws': ['inPath', 'push'],
      '.': ['beforeIdent', 'push'],
      '[': ['beforeElement', 'push'],
      'eof': ['afterPath', 'push']
    },

    'beforeElement': {
      'ws': ['beforeElement'],
      '0': ['afterZero', 'append'],
      'number': ['inIndex', 'append'],
      "'": ['inSingleQuote', 'append', ''],
      '"': ['inDoubleQuote', 'append', '']
    },

    'afterZero': {
      'ws': ['afterElement', 'push'],
      ']': ['inPath', 'push']
    },

    'inIndex': {
      '0': ['inIndex', 'append'],
      'number': ['inIndex', 'append'],
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    },

    'inSingleQuote': {
      "'": ['afterElement'],
      'eof': ['error'],
      'else': ['inSingleQuote', 'append']
    },

    'inDoubleQuote': {
      '"': ['afterElement'],
      'eof': ['error'],
      'else': ['inDoubleQuote', 'append']
    },

    'afterElement': {
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    }
  }

  function noop() {}

  function parsePath(path) {
    var keys = [];
    var index = -1;
    var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

    var actions = {
      push: function() {
        if (key === undefined)
          return;

        keys.push(key);
        key = undefined;
      },

      append: function() {
        if (key === undefined)
          key = newChar
        else
          key += newChar;
      }
    };

    function maybeUnescapeQuote() {
      if (index >= path.length)
        return;

      var nextChar = path[index + 1];
      if ((mode == 'inSingleQuote' && nextChar == "'") ||
          (mode == 'inDoubleQuote' && nextChar == '"')) {
        index++;
        newChar = nextChar;
        actions.append();
        return true;
      }
    }

    while (mode) {
      index++;
      c = path[index];

      if (c == '\\' && maybeUnescapeQuote(mode))
        continue;

      type = getPathCharType(c);
      typeMap = pathStateMachine[mode];
      transition = typeMap[type] || typeMap['else'] || 'error';

      if (transition == 'error')
        return; // parse error;

      mode = transition[0];
      action = actions[transition[1]] || noop;
      newChar = transition[2] === undefined ? c : transition[2];
      action();

      if (mode === 'afterPath') {
        return keys;
      }
    }

    return; // parse error
  }

  function isIdent(s) {
    return identRegExp.test(s);
  }

  var constructorIsPrivate = {};

  function Path(parts, privateToken) {
    if (privateToken !== constructorIsPrivate)
      throw Error('Use Path.get to retrieve path objects');

    for (var i = 0; i < parts.length; i++) {
      this.push(String(parts[i]));
    }

    if (hasEval && this.length) {
      this.getValueFrom = this.compiledGetValueFromFn();
    }
  }

  // TODO(rafaelw): Make simple LRU cache
  var pathCache = {};

  function getPath(pathString) {
    if (pathString instanceof Path)
      return pathString;

    if (pathString == null || pathString.length == 0)
      pathString = '';

    if (typeof pathString != 'string') {
      if (isIndex(pathString.length)) {
        // Constructed with array-like (pre-parsed) keys
        return new Path(pathString, constructorIsPrivate);
      }

      pathString = String(pathString);
    }

    var path = pathCache[pathString];
    if (path)
      return path;

    var parts = parsePath(pathString);
    if (!parts)
      return invalidPath;

    var path = new Path(parts, constructorIsPrivate);
    pathCache[pathString] = path;
    return path;
  }

  Path.get = getPath;

  function formatAccessor(key) {
    if (isIndex(key)) {
      return '[' + key + ']';
    } else {
      return '["' + key.replace(/"/g, '\\"') + '"]';
    }
  }

  Path.prototype = createObject({
    __proto__: [],
    valid: true,

    toString: function() {
      var pathString = '';
      for (var i = 0; i < this.length; i++) {
        var key = this[i];
        if (isIdent(key)) {
          pathString += i ? '.' + key : key;
        } else {
          pathString += formatAccessor(key);
        }
      }

      return pathString;
    },

    getValueFrom: function(obj, directObserver) {
      for (var i = 0; i < this.length; i++) {
        if (obj == null)
          return;
        obj = obj[this[i]];
      }
      return obj;
    },

    iterateObjects: function(obj, observe) {
      for (var i = 0; i < this.length; i++) {
        if (i)
          obj = obj[this[i - 1]];
        if (!isObject(obj))
          return;
        observe(obj, this[i]);
      }
    },

    compiledGetValueFromFn: function() {
      var str = '';
      var pathString = 'obj';
      str += 'if (obj != null';
      var i = 0;
      var key;
      for (; i < (this.length - 1); i++) {
        key = this[i];
        pathString += isIdent(key) ? '.' + key : formatAccessor(key);
        str += ' &&\n     ' + pathString + ' != null';
      }
      str += ')\n';

      var key = this[i];
      pathString += isIdent(key) ? '.' + key : formatAccessor(key);

      str += '  return ' + pathString + ';\nelse\n  return undefined;';
      return new Function('obj', str);
    },

    setValueFrom: function(obj, value) {
      if (!this.length)
        return false;

      for (var i = 0; i < this.length - 1; i++) {
        if (!isObject(obj))
          return false;
        obj = obj[this[i]];
      }

      if (!isObject(obj))
        return false;

      obj[this[i]] = value;
      return true;
    }
  });

  var invalidPath = new Path('', constructorIsPrivate);
  invalidPath.valid = false;
  invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};

  var MAX_DIRTY_CHECK_CYCLES = 1000;

  function dirtyCheck(observer) {
    var cycles = 0;
    while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
      cycles++;
    }
    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    return cycles > 0;
  }

  function objectIsEmpty(object) {
    for (var prop in object)
      return false;
    return true;
  }

  function diffIsEmpty(diff) {
    return objectIsEmpty(diff.added) &&
           objectIsEmpty(diff.removed) &&
           objectIsEmpty(diff.changed);
  }

  function diffObjectFromOldObject(object, oldObject) {
    var added = {};
    var removed = {};
    var changed = {};

    for (var prop in oldObject) {
      var newValue = object[prop];

      if (newValue !== undefined && newValue === oldObject[prop])
        continue;

      if (!(prop in object)) {
        removed[prop] = undefined;
        continue;
      }

      if (newValue !== oldObject[prop])
        changed[prop] = newValue;
    }

    for (var prop in object) {
      if (prop in oldObject)
        continue;

      added[prop] = object[prop];
    }

    if (Array.isArray(object) && object.length !== oldObject.length)
      changed.length = object.length;

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  var eomTasks = [];
  function runEOMTasks() {
    if (!eomTasks.length)
      return false;

    for (var i = 0; i < eomTasks.length; i++) {
      eomTasks[i]();
    }
    eomTasks.length = 0;
    return true;
  }

  var runEOM = hasObserve ? (function(){
    return function(fn) {
      return Promise.resolve().then(fn);
    }
  })() :
  (function() {
    return function(fn) {
      eomTasks.push(fn);
    };
  })();

  var observedObjectCache = [];

  function newObservedObject() {
    var observer;
    var object;
    var discardRecords = false;
    var first = true;

    function callback(records) {
      if (observer && observer.state_ === OPENED && !discardRecords)
        observer.check_(records);
    }

    return {
      open: function(obs) {
        if (observer)
          throw Error('ObservedObject in use');

        if (!first)
          Object.deliverChangeRecords(callback);

        observer = obs;
        first = false;
      },
      observe: function(obj, arrayObserve) {
        object = obj;
        if (arrayObserve)
          Array.observe(object, callback);
        else
          Object.observe(object, callback);
      },
      deliver: function(discard) {
        discardRecords = discard;
        Object.deliverChangeRecords(callback);
        discardRecords = false;
      },
      close: function() {
        observer = undefined;
        Object.unobserve(object, callback);
        observedObjectCache.push(this);
      }
    };
  }

  /*
   * The observedSet abstraction is a perf optimization which reduces the total
   * number of Object.observe observations of a set of objects. The idea is that
   * groups of Observers will have some object dependencies in common and this
   * observed set ensures that each object in the transitive closure of
   * dependencies is only observed once. The observedSet acts as a write barrier
   * such that whenever any change comes through, all Observers are checked for
   * changed values.
   *
   * Note that this optimization is explicitly moving work from setup-time to
   * change-time.
   *
   * TODO(rafaelw): Implement "garbage collection". In order to move work off
   * the critical path, when Observers are closed, their observed objects are
   * not Object.unobserve(d). As a result, it's possible that if the observedSet
   * is kept open, but some Observers have been closed, it could cause "leaks"
   * (prevent otherwise collectable objects from being collected). At some
   * point, we should implement incremental "gc" which keeps a list of
   * observedSets which may need clean-up and does small amounts of cleanup on a
   * timeout until all is clean.
   */

  function getObservedObject(observer, object, arrayObserve) {
    var dir = observedObjectCache.pop() || newObservedObject();
    dir.open(observer);
    dir.observe(object, arrayObserve);
    return dir;
  }

  var observedSetCache = [];

  function newObservedSet() {
    var observerCount = 0;
    var observers = [];
    var objects = [];
    var rootObj;
    var rootObjProps;

    function observe(obj, prop) {
      if (!obj)
        return;

      if (obj === rootObj)
        rootObjProps[prop] = true;

      if (objects.indexOf(obj) < 0) {
        objects.push(obj);
        Object.observe(obj, callback);
      }

      observe(Object.getPrototypeOf(obj), prop);
    }

    function allRootObjNonObservedProps(recs) {
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        if (rec.object !== rootObj ||
            rootObjProps[rec.name] ||
            rec.type === 'setPrototype') {
          return false;
        }
      }
      return true;
    }

    function callback(recs) {
      if (allRootObjNonObservedProps(recs))
        return;

      var observer;
      for (var i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.iterateObjects_(observe);
        }
      }

      for (var i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.check_();
        }
      }
    }

    var record = {
      objects: objects,
      get rootObject() { return rootObj; },
      set rootObject(value) {
        rootObj = value;
        rootObjProps = {};
      },
      open: function(obs, object) {
        observers.push(obs);
        observerCount++;
        obs.iterateObjects_(observe);
      },
      close: function(obs) {
        observerCount--;
        if (observerCount > 0) {
          return;
        }

        for (var i = 0; i < objects.length; i++) {
          Object.unobserve(objects[i], callback);
          Observer.unobservedCount++;
        }

        observers.length = 0;
        objects.length = 0;
        rootObj = undefined;
        rootObjProps = undefined;
        observedSetCache.push(this);
        if (lastObservedSet === this)
          lastObservedSet = null;
      },
    };

    return record;
  }

  var lastObservedSet;

  function getObservedSet(observer, obj) {
    if (!lastObservedSet || lastObservedSet.rootObject !== obj) {
      lastObservedSet = observedSetCache.pop() || newObservedSet();
      lastObservedSet.rootObject = obj;
    }
    lastObservedSet.open(observer, obj);
    return lastObservedSet;
  }

  var UNOPENED = 0;
  var OPENED = 1;
  var CLOSED = 2;
  var RESETTING = 3;

  var nextObserverId = 1;

  function Observer() {
    this.state_ = UNOPENED;
    this.callback_ = undefined;
    this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
    this.directObserver_ = undefined;
    this.value_ = undefined;
    this.id_ = nextObserverId++;
  }

  Observer.prototype = {
    open: function(callback, target) {
      if (this.state_ != UNOPENED)
        throw Error('Observer has already been opened.');

      addToAll(this);
      this.callback_ = callback;
      this.target_ = target;
      this.connect_();
      this.state_ = OPENED;
      return this.value_;
    },

    close: function() {
      if (this.state_ != OPENED)
        return;

      removeFromAll(this);
      this.disconnect_();
      this.value_ = undefined;
      this.callback_ = undefined;
      this.target_ = undefined;
      this.state_ = CLOSED;
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      dirtyCheck(this);
    },

    report_: function(changes) {
      try {
        this.callback_.apply(this.target_, changes);
      } catch (ex) {
        Observer._errorThrownDuringCallback = true;
        console.error('Exception caught during observer callback: ' +
                       (ex.stack || ex));
      }
    },

    discardChanges: function() {
      this.check_(undefined, true);
      return this.value_;
    }
  }

  var collectObservers = !hasObserve;
  var allObservers;
  Observer._allObserversCount = 0;

  if (collectObservers) {
    allObservers = [];
  }

  function addToAll(observer) {
    Observer._allObserversCount++;
    if (!collectObservers)
      return;

    allObservers.push(observer);
  }

  function removeFromAll(observer) {
    Observer._allObserversCount--;
  }

  var runningMicrotaskCheckpoint = false;

  global.Platform = global.Platform || {};

  global.Platform.performMicrotaskCheckpoint = function() {
    if (runningMicrotaskCheckpoint)
      return;

    if (!collectObservers)
      return;

    runningMicrotaskCheckpoint = true;

    var cycles = 0;
    var anyChanged, toCheck;

    do {
      cycles++;
      toCheck = allObservers;
      allObservers = [];
      anyChanged = false;

      for (var i = 0; i < toCheck.length; i++) {
        var observer = toCheck[i];
        if (observer.state_ != OPENED)
          continue;

        if (observer.check_())
          anyChanged = true;

        allObservers.push(observer);
      }
      if (runEOMTasks())
        anyChanged = true;
    } while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);

    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    runningMicrotaskCheckpoint = false;
  };

  if (collectObservers) {
    global.Platform.clearObservers = function() {
      allObservers = [];
    };
  }

  function ObjectObserver(object) {
    Observer.call(this);
    this.value_ = object;
    this.oldObject_ = undefined;
  }

  ObjectObserver.prototype = createObject({
    __proto__: Observer.prototype,

    arrayObserve: false,

    connect_: function(callback, target) {
      if (hasObserve) {
        this.directObserver_ = getObservedObject(this, this.value_,
                                                 this.arrayObserve);
      } else {
        this.oldObject_ = this.copyObject(this.value_);
      }

    },

    copyObject: function(object) {
      var copy = Array.isArray(object) ? [] : {};
      for (var prop in object) {
        copy[prop] = object[prop];
      };
      if (Array.isArray(object))
        copy.length = object.length;
      return copy;
    },

    check_: function(changeRecords, skipChanges) {
      var diff;
      var oldValues;
      if (hasObserve) {
        if (!changeRecords)
          return false;

        oldValues = {};
        diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                                           oldValues);
      } else {
        oldValues = this.oldObject_;
        diff = diffObjectFromOldObject(this.value_, this.oldObject_);
      }

      if (diffIsEmpty(diff))
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([
        diff.added || {},
        diff.removed || {},
        diff.changed || {},
        function(property) {
          return oldValues[property];
        }
      ]);

      return true;
    },

    disconnect_: function() {
      if (hasObserve) {
        this.directObserver_.close();
        this.directObserver_ = undefined;
      } else {
        this.oldObject_ = undefined;
      }
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      if (hasObserve)
        this.directObserver_.deliver(false);
      else
        dirtyCheck(this);
    },

    discardChanges: function() {
      if (this.directObserver_)
        this.directObserver_.deliver(true);
      else
        this.oldObject_ = this.copyObject(this.value_);

      return this.value_;
    }
  });

  function ArrayObserver(array) {
    if (!Array.isArray(array))
      throw Error('Provided object is not an Array');
    ObjectObserver.call(this, array);
  }

  ArrayObserver.prototype = createObject({

    __proto__: ObjectObserver.prototype,

    arrayObserve: true,

    copyObject: function(arr) {
      return arr.slice();
    },

    check_: function(changeRecords) {
      var splices;
      if (hasObserve) {
        if (!changeRecords)
          return false;
        splices = projectArraySplices(this.value_, changeRecords);
      } else {
        splices = calcSplices(this.value_, 0, this.value_.length,
                              this.oldObject_, 0, this.oldObject_.length);
      }

      if (!splices || !splices.length)
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([splices]);
      return true;
    }
  });

  ArrayObserver.applySplices = function(previous, current, splices) {
    splices.forEach(function(splice) {
      var spliceArgs = [splice.index, splice.removed.length];
      var addIndex = splice.index;
      while (addIndex < splice.index + splice.addedCount) {
        spliceArgs.push(current[addIndex]);
        addIndex++;
      }

      Array.prototype.splice.apply(previous, spliceArgs);
    });
  };

  function PathObserver(object, path) {
    Observer.call(this);

    this.object_ = object;
    this.path_ = getPath(path);
    this.directObserver_ = undefined;
  }

  PathObserver.prototype = createObject({
    __proto__: Observer.prototype,

    get path() {
      return this.path_;
    },

    connect_: function() {
      if (hasObserve)
        this.directObserver_ = getObservedSet(this, this.object_);

      this.check_(undefined, true);
    },

    disconnect_: function() {
      this.value_ = undefined;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    iterateObjects_: function(observe) {
      this.path_.iterateObjects(this.object_, observe);
    },

    check_: function(changeRecords, skipChanges) {
      var oldValue = this.value_;
      this.value_ = this.path_.getValueFrom(this.object_);
      if (skipChanges || areSameValue(this.value_, oldValue))
        return false;

      this.report_([this.value_, oldValue, this]);
      return true;
    },

    setValue: function(newValue) {
      if (this.path_)
        this.path_.setValueFrom(this.object_, newValue);
    }
  });

  function CompoundObserver(reportChangesOnOpen) {
    Observer.call(this);

    this.reportChangesOnOpen_ = reportChangesOnOpen;
    this.value_ = [];
    this.directObserver_ = undefined;
    this.observed_ = [];
  }

  var observerSentinel = {};

  CompoundObserver.prototype = createObject({
    __proto__: Observer.prototype,

    connect_: function() {
      if (hasObserve) {
        var object;
        var needsDirectObserver = false;
        for (var i = 0; i < this.observed_.length; i += 2) {
          object = this.observed_[i]
          if (object !== observerSentinel) {
            needsDirectObserver = true;
            break;
          }
        }

        if (needsDirectObserver)
          this.directObserver_ = getObservedSet(this, object);
      }

      this.check_(undefined, !this.reportChangesOnOpen_);
    },

    disconnect_: function() {
      for (var i = 0; i < this.observed_.length; i += 2) {
        if (this.observed_[i] === observerSentinel)
          this.observed_[i + 1].close();
      }
      this.observed_.length = 0;
      this.value_.length = 0;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    addPath: function(object, path) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add paths once started.');

      var path = getPath(path);
      this.observed_.push(object, path);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = path.getValueFrom(object);
    },

    addObserver: function(observer) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add observers once started.');

      this.observed_.push(observerSentinel, observer);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = observer.open(this.deliver, this);
    },

    startReset: function() {
      if (this.state_ != OPENED)
        throw Error('Can only reset while open');

      this.state_ = RESETTING;
      this.disconnect_();
    },

    finishReset: function() {
      if (this.state_ != RESETTING)
        throw Error('Can only finishReset after startReset');
      this.state_ = OPENED;
      this.connect_();

      return this.value_;
    },

    iterateObjects_: function(observe) {
      var object;
      for (var i = 0; i < this.observed_.length; i += 2) {
        object = this.observed_[i]
        if (object !== observerSentinel)
          this.observed_[i + 1].iterateObjects(object, observe)
      }
    },

    check_: function(changeRecords, skipChanges) {
      var oldValues;
      for (var i = 0; i < this.observed_.length; i += 2) {
        var object = this.observed_[i];
        var path = this.observed_[i+1];
        var value;
        if (object === observerSentinel) {
          var observable = path;
          value = this.state_ === UNOPENED ?
              observable.open(this.deliver, this) :
              observable.discardChanges();
        } else {
          value = path.getValueFrom(object);
        }

        if (skipChanges) {
          this.value_[i / 2] = value;
          continue;
        }

        if (areSameValue(value, this.value_[i / 2]))
          continue;

        oldValues = oldValues || [];
        oldValues[i / 2] = this.value_[i / 2];
        this.value_[i / 2] = value;
      }

      if (!oldValues)
        return false;

      // TODO(rafaelw): Having observed_ as the third callback arg here is
      // pretty lame API. Fix.
      this.report_([this.value_, oldValues, this.observed_]);
      return true;
    }
  });

  function identFn(value) { return value; }

  function ObserverTransform(observable, getValueFn, setValueFn,
                             dontPassThroughSet) {
    this.callback_ = undefined;
    this.target_ = undefined;
    this.value_ = undefined;
    this.observable_ = observable;
    this.getValueFn_ = getValueFn || identFn;
    this.setValueFn_ = setValueFn || identFn;
    // TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
    // at the moment because of a bug in it's dependency tracking.
    this.dontPassThroughSet_ = dontPassThroughSet;
  }

  ObserverTransform.prototype = {
    open: function(callback, target) {
      this.callback_ = callback;
      this.target_ = target;
      this.value_ =
          this.getValueFn_(this.observable_.open(this.observedCallback_, this));
      return this.value_;
    },

    observedCallback_: function(value) {
      value = this.getValueFn_(value);
      if (areSameValue(value, this.value_))
        return;
      var oldValue = this.value_;
      this.value_ = value;
      this.callback_.call(this.target_, this.value_, oldValue);
    },

    discardChanges: function() {
      this.value_ = this.getValueFn_(this.observable_.discardChanges());
      return this.value_;
    },

    deliver: function() {
      return this.observable_.deliver();
    },

    setValue: function(value) {
      value = this.setValueFn_(value);
      if (!this.dontPassThroughSet_ && this.observable_.setValue)
        return this.observable_.setValue(value);
    },

    close: function() {
      if (this.observable_)
        this.observable_.close();
      this.callback_ = undefined;
      this.target_ = undefined;
      this.observable_ = undefined;
      this.value_ = undefined;
      this.getValueFn_ = undefined;
      this.setValueFn_ = undefined;
    }
  }

  var expectedRecordTypes = {
    add: true,
    update: true,
    delete: true
  };

  function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
    var added = {};
    var removed = {};

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      if (!expectedRecordTypes[record.type]) {
        console.error('Unknown changeRecord type: ' + record.type);
        console.error(record);
        continue;
      }

      if (!(record.name in oldValues))
        oldValues[record.name] = record.oldValue;

      if (record.type == 'update')
        continue;

      if (record.type == 'add') {
        if (record.name in removed)
          delete removed[record.name];
        else
          added[record.name] = true;

        continue;
      }

      // type = 'delete'
      if (record.name in added) {
        delete added[record.name];
        delete oldValues[record.name];
      } else {
        removed[record.name] = true;
      }
    }

    for (var prop in added)
      added[prop] = object[prop];

    for (var prop in removed)
      removed[prop] = undefined;

    var changed = {};
    for (var prop in oldValues) {
      if (prop in added || prop in removed)
        continue;

      var newValue = object[prop];
      if (oldValues[prop] !== newValue)
        changed[prop] = newValue;
    }

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  function ArraySplice() {}

  ArraySplice.prototype = {

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    calcEditDistances: function(current, currentStart, currentEnd,
                                old, oldStart, oldEnd) {
      // "Deletion" columns
      var rowCount = oldEnd - oldStart + 1;
      var columnCount = currentEnd - currentStart + 1;
      var distances = new Array(rowCount);

      // "Addition" rows. Initialize null column.
      for (var i = 0; i < rowCount; i++) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      // Initialize null row
      for (var j = 0; j < columnCount; j++)
        distances[0][j] = j;

      for (var i = 1; i < rowCount; i++) {
        for (var j = 1; j < columnCount; j++) {
          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
            distances[i][j] = distances[i - 1][j - 1];
          else {
            var north = distances[i - 1][j] + 1;
            var west = distances[i][j - 1] + 1;
            distances[i][j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    spliceOperationsFromEditDistances: function(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var current = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        var northWest = distances[i - 1][j - 1];
        var west = distances[i - 1][j];
        var north = distances[i][j - 1];

        var min;
        if (west < north)
          min = west < northWest ? west : northWest;
        else
          min = north < northWest ? north : northWest;

        if (min == northWest) {
          if (northWest == current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    /**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     */

    /**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     */
    calcSplices: function(current, currentStart, currentEnd,
                          old, oldStart, oldEnd) {
      var prefixCount = 0;
      var suffixCount = 0;

      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart == 0 && oldStart == 0)
        prefixCount = this.sharedPrefix(current, old, minLength);

      if (currentEnd == current.length && oldEnd == old.length)
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
        return [];

      if (currentStart == currentEnd) {
        var splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd)
          splice.removed.push(old[oldStart++]);

        return [ splice ];
      } else if (oldStart == oldEnd)
        return [ newSplice(currentStart, [], currentEnd - currentStart) ];

      var ops = this.spliceOperationsFromEditDistances(
          this.calcEditDistances(current, currentStart, currentEnd,
                                 old, oldStart, oldEnd));

      var splice = undefined;
      var splices = [];
      var index = currentStart;
      var oldIndex = oldStart;
      for (var i = 0; i < ops.length; i++) {
        switch(ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix: function(current, old, searchLength) {
      for (var i = 0; i < searchLength; i++)
        if (!this.equals(current[i], old[i]))
          return i;
      return searchLength;
    },

    sharedSuffix: function(current, old, searchLength) {
      var index1 = current.length;
      var index2 = old.length;
      var count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2]))
        count++;

      return count;
    },

    calculateSplices: function(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0,
                              previous.length);
    },

    equals: function(currentValue, previousValue) {
      return currentValue === previousValue;
    }
  };

  var arraySplice = new ArraySplice();

  function calcSplices(current, currentStart, currentEnd,
                       old, oldStart, oldEnd) {
    return arraySplice.calcSplices(current, currentStart, currentEnd,
                                   old, oldStart, oldEnd);
  }

  function intersect(start1, end1, start2, end2) {
    // Disjoint
    if (end1 < start2 || end2 < start1)
      return -1;

    // Adjacent
    if (end1 == start2 || end2 == start1)
      return 0;

    // Non-zero intersect, span1 first
    if (start1 < start2) {
      if (end1 < end2)
        return end1 - start2; // Overlap
      else
        return end2 - start2; // Contained
    } else {
      // Non-zero intersect, span2 first
      if (end2 < end1)
        return end2 - start1; // Overlap
      else
        return end1 - start1; // Contained
    }
  }

  function mergeSplice(splices, index, removed, addedCount) {

    var splice = newSplice(index, removed, addedCount);

    var inserted = false;
    var insertionOffset = 0;

    for (var i = 0; i < splices.length; i++) {
      var current = splices[i];
      current.index += insertionOffset;

      if (inserted)
        continue;

      var intersectCount = intersect(splice.index,
                                     splice.index + splice.removed.length,
                                     current.index,
                                     current.index + current.addedCount);

      if (intersectCount >= 0) {
        // Merge the two splices

        splices.splice(i, 1);
        i--;

        insertionOffset -= current.addedCount - current.removed.length;

        splice.addedCount += current.addedCount - intersectCount;
        var deleteCount = splice.removed.length +
                          current.removed.length - intersectCount;

        if (!splice.addedCount && !deleteCount) {
          // merged splice is a noop. discard.
          inserted = true;
        } else {
          var removed = current.removed;

          if (splice.index < current.index) {
            // some prefix of splice.removed is prepended to current.removed.
            var prepend = splice.removed.slice(0, current.index - splice.index);
            Array.prototype.push.apply(prepend, removed);
            removed = prepend;
          }

          if (splice.index + splice.removed.length > current.index + current.addedCount) {
            // some suffix of splice.removed is appended to current.removed.
            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
            Array.prototype.push.apply(removed, append);
          }

          splice.removed = removed;
          if (current.index < splice.index) {
            splice.index = current.index;
          }
        }
      } else if (splice.index < current.index) {
        // Insert splice here.

        inserted = true;

        splices.splice(i, 0, splice);
        i++;

        var offset = splice.addedCount - splice.removed.length
        current.index += offset;
        insertionOffset += offset;
      }
    }

    if (!inserted)
      splices.push(splice);
  }

  function createInitialSplices(array, changeRecords) {
    var splices = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      switch(record.type) {
        case 'splice':
          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
          break;
        case 'add':
        case 'update':
        case 'delete':
          if (!isIndex(record.name))
            continue;
          var index = toNumber(record.name);
          if (index < 0)
            continue;
          mergeSplice(splices, index, [record.oldValue], 1);
          break;
        default:
          console.error('Unexpected record type: ' + JSON.stringify(record));
          break;
      }
    }

    return splices;
  }

  function projectArraySplices(array, changeRecords) {
    var splices = [];

    createInitialSplices(array, changeRecords).forEach(function(splice) {
      if (splice.addedCount == 1 && splice.removed.length == 1) {
        if (splice.removed[0] !== array[splice.index])
          splices.push(splice);

        return
      };

      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                           splice.removed, 0, splice.removed.length));
    });

    return splices;
  }

  // Export the observe-js object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, export as a global object.

  var expose = global;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      expose = exports = module.exports;
    }
    expose = exports;
  } 

  expose.Observer = Observer;
  expose.Observer.runEOM_ = runEOM;
  expose.Observer.observerSentinel_ = observerSentinel; // for testing.
  expose.Observer.hasObjectObserve = hasObserve;
  expose.ArrayObserver = ArrayObserver;
  expose.ArrayObserver.calculateSplices = function(current, previous) {
    return arraySplice.calculateSplices(current, previous);
  };

  expose.ArraySplice = ArraySplice;
  expose.ObjectObserver = ObjectObserver;
  expose.PathObserver = PathObserver;
  expose.CompoundObserver = CompoundObserver;
  expose.Path = Path;
  expose.ObserverTransform = ObserverTransform;
  
})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);

var Circular = {
	
	/* ----------------------
		config
	----------------------- */
	
	config	: {
		version				: '0.0.9',
		autoinit			:	 true,
		attrprefix		: 'cc-',
		dataprefix		: 'data-'
	},
	
	// status
	inited		: false,
	dead			: false,
	$queued		: $({}),	

	/* ----------------------
		modules 
	----------------------- */
	
	modules : {
		
		
		stack	: [
			// this is where the circularmodules are stored
			// the order matters
		],
		
		attr2idx					: {
			// map attribute names to modules
		},
		
		name2idx					: {
			// map module names to modules
		},
		
		attr2cname				: {
			// normalized attr names
		},
		
		add	: function(mod) {
		
			if (Circular.debug) {
				Circular.debug.write('Circular.modules.add',mod.name);
			}
			
			if (!Circular.dead) {

				valid = true;
				
				if (this.name2idx[mod.name]) {
					if (!mod.override) {
						if (Circular.log) Circular.log.error('Circular.modules.add','mod.'+mod.name+' namespace already taken');
						valid = false;
					} 
				}
				
				if (mod.requires) {
					mod.requires.forEach(function(name) {
						if (this.name2idx[name]===undefined) {
							if (Circular.log) Circular.log.error('Circular.modules.add','mod.'+mod.name+' requires mod.'+name);
							valid=false;
						}
					},this);
				}
				
				if (valid) {
				
					var idx 			= 0;
					var replace	= false;
					
					if (this.name2idx[mod.name]) {
					
						// we are overriding an old module
						// remove all the stuff pointing to it
						
						var oldidx = this.name2idx[mod.name];
						for (var attr in this.attr2idx) {
							if (this.attr2idx[attr]==oldidx) {
								delete this.attr2idx[attr];
							}
						}
						
						// by default, use the old index
						if (!mod.priority) 	{
							replace	= true;
							mod.priority = oldidx;
						}
					} 
					
					if (mod.priority && mod.priority<this.stack.length) {
						idx = mod.priority;
						if (replace) {
							
							this.stack[idx]=mod;
						} else {
							
							this.stack.splice(idx,0,mod);
							// rewrite all the higher indexes.
							for (var attr in this.attr2idx) {
								if (this.attr2idx[attr]>=idx) {
									this.attr2idx[attr]++;
								}
							}
							
							for (var name in this.name2idx) {
								if (this.name2idx[name]>=idx) {
									this.name2idx[name]++;
								}
							}
							
						}
					} else {
						idx = this.stack.length;
						this.stack.push(mod);
					} 
				
					
					this.name2idx[mod.name]=idx;
					
					for (var ac=0; ac<mod.attributes.length;ac++) {
						var attrname = mod.attributes[ac];
						this.attr2idx[attrname]=idx;
						this.attr2idx[attrname]=idx;
						this.attr2cname[attrname]=attrname;
						this.attr2cname[Circular.config.dataprefix+attrname]=attrname;
					}
					
					Circular[mod.name]=this.stack[idx];
					
					if (mod.name=="debug" && Circular.config.debug) {
						
						Circular.debug.on();
					}
					
				} else {
					// crucial. i think i want you.
					if (Circular.log) Circular.log.fatal('Circular.modules.add','fatal error');
					Circular.die();
				}
			}

		},
		
		init	: function(config) {
			
			if (Circular.debug) Circular.debug.write('Circular.modules.init');
						
			// create a stylesheet, add all css and config
			var css = '';
			this.stack.forEach(function(mod) {
				if (mod.css) css += mod.css;
				if (mod.config) $.extend(Circular.config,mod.config);
			});
			
			if (css) {
				var styleElement = document.createElement("style");
				styleElement.type = "text/css";
				document.head.appendChild(styleElement);
				
				// ruff stuff. probs in ie<9
				styleElement.appendChild(document.createTextNode(css));
			}
			
			// override config before you init
			$.extend(Circular.config,config);
			
			for (var dc=0; dc < this.stack.length; dc++) {
				if (this.stack[dc].init) {
					this.stack[dc].init();
				}
			}
				
			
		}
		
		
		
	},

	/* ----------------------
		queue 
	----------------------- */
	

	
	queue			: function(func) {
		Circular.debug.write("Circular.engine.queue",this.$queued.size()+1);
		this.$queued.queue('circular',function(next) {
			func(); next();
		})
		this.$queued.dequeue('circular'); 
	},
	
	/* ----------------------
		init 
	----------------------- */

	init 		: function(config) {
		$(document).ready(function() {
			Circular.modules.init(config);
			if (Circular.engine) {
				Circular.engine.start();	
			} else if (Circular.log) {
				Circular.log.fatal('Circular mod.engine not found');
			} else {
				alert('Circular mod.engine and mod.log not found');
				Circular.die();
			}
		});
		this.inited = true;
	},
	
	die		: function() {
		this.dead = true;
	}


}


function CircularModule(def) {

	if (def.name) {
	
		if (!def.in)					def.in 	= function(attr,node,props) { return true; }
		if (!def.out) 				def.out = function(attr,node,props) { return true; }	
		if (!def.requires)		def.requires = [];
		if (!def.attributes)	def.attributes = [Circular.config.attrprefix+def.name];
		if (!def.override)		def.override = false;
		if (!def.priority)		def.priority = 0;
		if (!def.config)			def.config = {};
		Circular.modules.add(def);
		
	} else if (Circular.log) {
		Circular.log.fatal('CircularModule.name is required');
	} else {
		alert('CircularModule.name is required');
		Circular.die();
	}
}

$(document).ready(function() {
	if (Circular.config.autoinit && !Circular.inited) {
		Circular.init();
	}
});


/* ----------------------
	log
----------------------- */

new CircularModule({

	name	: 'log',
	
	in		: function(attr,node,props) {
		this.info(attr.value);
	},
	
	write		: function() {
		console.log.apply(console,arguments);
	},
	info	: function() {
		console.info.apply(console,arguments);
	},
	warn	: function() {
		console.warn.apply(console,arguments);
	},
	error	: function() {
		console.error.apply(console,arguments);
	},
	fatal:	function() {
		console.error.apply(console,arguments);
		Circular.die();
	}
});
/* ----------------------
	debug
----------------------- */

new CircularModule({

	name				: 'debug',
	requires	: ['log'],
	config		: {
		debug	: false
	},
	
	enabled		: false,

	init	: function() {
		if (Circular.config.debug) {
			this.toggle(true);
		}
	},
	
	in	: function(attr,node,props) {
		this.write('mod.debug',node);
		attr.outer = this.enabled;
		if (Circular.parser) this.toggle(Circular.parser.boolish(attr.value));
		else this.toggle(!attr.original || attr.result); // simpleparse
	},
	
	out	: function(attr,node,props) {
		this.toggle(attr.outer);
		delete attr.outer;
	},
	
	toggle: function(state) 	{ 
		if (state===undefined) state = !this.enabled;
		if (!state) this.write('mod.debug - off');
		this.enabled=state; 
		if (state) this.write('mod.debug - on');
	},
	on	: function() {
		this.toggle(true);
	}, 
	off : function() {
		this.toggle(false);
	},
	write	: function() {
		if (this.enabled) {
			if (Circular.engine) {
				arguments = Array.prototype.concat.apply([Circular.engine.counter], arguments);
			}
			Circular.log.write(arguments);
		}
	}
	
	
});
/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['debug'],
	config			: {
		rootcontext		: 'document'
	},
	current			: '',
	
	init				: function() {
		this.set(Circular.config.rootcontext);
	},
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.context.in','setting context',attr.value);
		attr.before = this.get();
		if (!attr.expression || typeof attr.result == "string") {
			this.set(attr.value);
		} else {
			Circular.debug.write('mod.context.in','Result is not a string, using expression');
			this.set(attr.expression);
		}
	},
	
	out	: function(attr,node,props) {
		Circular.debug.write('mod.context.out','resetting context');
		this.set(attr.before);
		delete attr.before;
	},
	
	set		: function(context) {
			this.current = context;
	},
	get		: function() {
			return this.current;
	}
		
		
});


/* ----------------------
	root
----------------------- */

new CircularModule({
	name				: 'root'
	// does nothing
});


/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['debug'],
	
	css		: '.cc-content-generated {  }',
	in	: function(attr,node,props) {
		Circular.debug.write('mod.content.in','setting content',node,attr.result);
		node.textContent=attr.result;
		$(node).addClass('cc-content-generated');
	}

		
});



/* ----------------------
	parser
----------------------- */

new CircularModule({
	
	name			: 'parser',
	requires	: ['log','debug'],
	config		: {
		// exprregex		:	/{{([^}]*?)}}/g,
		// exprregex			:	/{({|\[)([^}\]]*?)(}|\])}/g,
		// exprregex 			: /{({|\[)(.*?(?=[}\]]}))(}|\])}/g,
		exprregex				: /{[{\[]([\s\S]*?(?=[}\]]}))[}\]]+}/g,
		evalfail				: undefined,
		rootscope				: 'window' // bad idea
	},
	
	// requires esprima.
	// @see http://esprima.org/demo/parse.html
	
	
	getPaths :	function(expression) {
		Circular.debug.write('Circular.parser.getPaths',expression);
		var ast = null;
		try {
			ast = esprima.parse(expression);
		} catch (e) {
			// thats not valid javascript. perhaps its an object def
			try {
        ast = esprima.parse('var foo='+expression);
    	} catch (e) {
        // its not json either
        Circular.log.error('Circular.parser.getPaths',expression,'not ecmascript, not an object def');
        return false;
    	}
		}
		
		if (ast) {
			Circular.debug.write('Circular.parser.getPaths',ast);
			var paths = new Array();
			this.recursePaths(ast,paths);
			return paths;
		} else return false;
	},
	
	recursePaths	: function(tree,paths,path) {
	
		Circular.debug.write('Circular.parser.recursePaths',paths,path);
		
		if (!tree || !paths) return false;
		if (tree.type =='Identifier') {

			// some sort of global
			Circular.debug.write('Circular.parser.recursePaths','adding identifier '+tree.name);
			paths.push(Circular.config.rootscope+'.'+tree.name);

		} else if (tree.type =='MemberExpression') {
		
			// member expression
			
			
			if (tree.property.type=='Identifier' || tree.property.type=='Literal') {
			
				// like foo[bar][24].quz ; the property is 'quz'
				// dabble down the object to get the path
				
				if (tree.property.type=='Identifier') {
					path = (path)?'.'+tree.property.name+path:'.'+tree.property.name;
				} else {
					path = (path)?'['+tree.property.raw+']'+path:'['+tree.property.raw+']';
				}
				
				if (tree.object.type=='Identifier') {
					
					// like foo.bar ; were done with this path - push !
					Circular.debug.write('Circular.parser.recursePaths','adding path '+tree.object.name+path);
					
					if (path.indexOf('.')===0) {
						paths.push(tree.object.name+'.'+path.substring(1));
					} else {
						paths.push(Circular.config.rootscope+'.'+tree.object.name+path);
					}
					
				} else {
					if (tree.object.type=='MemberExpression') {
						
						// like foo.bar.quz ; recurse the object
						Circular.debug.write('Circular.parser.recursePaths','recursing member expression ..');
						this.recursePaths(tree.object,paths,path);						
					
					} else {
						
						// like foo(bar).quz ; the object is something weird. 
						// ignore the property .. but recurse the object
						this.recursePaths(tree.object,paths);	
					
					}
				}
			} else {
			
				// the property is some sort of thing itself:
				
				if (tree.object.type=='Identifier') {
					
					// like foo[bar.quz] - push the object, recurse the property
					Circular.debug.write('Circular.parser.recursePaths','adding identifier '+tree.object.name);
					paths.push(Circular.config.rootscope+'.'+tree.object.name);
					this.recursePaths(tree.property);	
					
				} else {
				
					// like foo.bar[quz(raz)] ; recurse both
					Circular.debug.write('Circular.parser.recursePaths','recursing member expression ..');
					this.recursePaths(tree.object,paths);	
					this.recursePaths(tree.property,paths);	
				
					
				}
				
			}
			
		} else if (tree.type=="CallExpression") {
		
			// like foo.bar(quz.baz) ;
			this.recursePaths(tree.arguments,paths);
			
			// think .toUpperCase()
			if (tree.callee && tree.callee.object) {
				this.recursePaths(tree.callee.object,paths);
			}
			
		} else if (tree.type=="AssignmentExpression") {
		
			// like foo.bar=baz*quz ; we only want the right hand
			this.recursePaths(tree.right,paths);
			
		} else {
		
			// unknown garbage. dig deeper.
			var props = Object.getOwnPropertyNames(tree);
			for (var pc=0; pc<props.length; pc++) {
				var key = props[pc];
				if (typeof tree[key] == 'object') {
					if (Array.isArray(tree[key])) {
						for (var kc=0;kc<tree[key].length;kc++) {
							Circular.debug.write('Circular.parser.recursePaths','recursing '+key+':'+kc);
							this.recursePaths(tree[key][kc],paths);
						}
					} else {
						Circular.debug.write('Circular.parser.recursePaths','recursing '+key,tree[key]);
						this.recursePaths(tree[key],paths);
						
					}
				} else {
					Circular.debug.write('Circular.parser.recursePaths','ignoring '+key);
				}
				
			}
		}
		
	},
	
	/*val		: function(str,ctx) {
		var parsed = this.parse(str,ctx);
		if (parsed) {
			return this.eval(parsed);
		} else {
			return str;
		}
	},*/
	
	/*expression: function(str,ctx) {
		var parsed = this.parse(str,ctx);
		return parsed.expression;
	},
	result		: function(str,ctx) {
		var parsed = this.parse(str,ctx);
		return parsed.expression;
	},
	value			: function(str,ctx) {
		var parsed = this.parse(str,ctx);
		return parsed.value;
	}*/
	
	
	match	: function(x) {
		// returns an array of matches or false
		Circular.debug.write('Circular.parser.match',x);
		return x.match(Circular.config.exprregex);
	},
	
	// split a text into an array
	// of plain text string and {{expressions}}
	split	: function(text) {
		Circular.debug.write('Circular.parser.split',text);
		var exec; var result = []; 
		var cursor = 0;
		while (exec = Circular.config.exprregex.exec(text)) {
			if (cursor<exec.index) {
				result.push({text:text.substring(cursor,exec.index)});
			}
			result.push({expression:exec[0]});
			cursor = exec.index + exec[0].length;
		}
		if (cursor<text.length) {
			result.push({text:text.substring(cursor,text.length)});
		}
		return result;
	},
	
	// parse a string including {{moustaches}}, returning an array of 
	// expression - qualified expression without {{moustaches}} in which
	// context expressions have been replaced. or false
	// result	- evaluated expression
	// value - string value of result
	// paths - paths to watch in expression
	
	parse	: function(expr,ctx) {
		Circular.debug.write('Circular.parser.parse',expr);
		matches = expr.match(Circular.config.exprregex);
		if (matches) {
			//console.log(matches[0],expr);
			if (matches[0]===expr) {
				// this is a single full expression "{{#foo}}"
				parsed = expr.substring(2,expr.length-2);
				parsed = parsed.replace(/#this/g,ctx);
				parsed = parsed.replace(/#/g,ctx+'.');
				parsed = parsed.replace(/@/g,'Circular.');
				if (expr.substring(0,2)=="{[") {
					parsed = JSON.stringify(this.eval(parsed));
				}
			} else {
				// console.log(matches);
				// this is a stringlike thing, "foo {{#bar}}"
				var parsed = expr.replace(Circular.config.exprregex,function(match,inner) {
					inner = inner.replace(/#this/g,ctx);
					inner = inner.replace(/#/g,ctx+'.');
					inner = inner.replace(/@/g,'Circular.');
					if (match.substring(0,2)=="{[") {
						return '"+'+JSON.stringify(this.eval(inner))+'+"';
					} else {
						return '"+('+inner+')+"';
					}
				});
				// tell eval that this is a stringthing
				parsed = '"'+parsed+'"';
			}
			Circular.debug.write("Circular.parser.parse",expr,ctx,parsed);
			return parsed;
		} else {
			Circular.debug.write('Circular.parser.parse','no match');
		}
		return '';
	},
	
	parseAttribute	: function(attr,ctx) {
		Circular.debug.write('Circular.parser.parse',attr.original);
		
		var matches = attr.original.match(Circular.config.exprregex);
		if (matches) {
			//console.log(matches[0],attr.original);
			if (matches[0]===attr.original) {
			
			
				// this is a single full expression "{{#foo}}"
				var orgexpr	= attr.expression;
				attr.expression = attr.original.substring(2,attr.original.length-2);
				attr.expression = attr.expression.replace(/#this/g,ctx);
				attr.expression = attr.expression.replace(/#/g,ctx+'.');
				attr.expression = attr.expression.replace(/@/g,'Circular.');
				if (!attr.flags.parsed || attr.expression!=orgexpr) {
					// the expression is new or changed. need to get paths
					if (attr.original.substring(0,2)=="{{") {
						// slice the old saucage for the watchdog
						if (attr.paths) attr.oldpaths = attr.paths.slice(0);
						attr.paths 	= this.getPaths(attr.expression);
					}	
				}
				
			} else {
			
				// this is a stringlike thing, "foo {{#bar}}"
				// console.log(matches);
				
				var watches = [];
				var orgexpr	= attr.expression;
				attr.expression = attr.original.replace(Circular.config.exprregex,function(match,inner) {
					inner = inner.replace(/#this/g,ctx);
					inner = inner.replace(/#/g,ctx+'.');
					inner = inner.replace(/@/g,'Circular.');
					if (match.substring(0,2)=="{{") {
						watches.push(inner);
					}
					return '"+('+inner+')+"';
				});
				// tell eval that this is a stringthing
				attr.expression = '"'+attr.expression+'"';
				
				if (!attr.flags.parsed || attr.expression!=orgexpr) {
					// the expression is new or changed. need to get paths
					if (attr.paths) attr.oldpaths = attr.paths.slice(0);
					attr.paths = [];
					for (var wc=0; wc<watches.length;wc++) {
						attr.paths.push(this.getPaths(watches[wc]));
					}
				}
			}
			
			attr.flags.parsed = true;
			Circular.debug.write("Circular.parser.parse",attr.original,ctx,attr.expression);
			return true;
			
		} else {
			Circular.debug.write('Circular.parser.parse','no match');
		}
		return false;
	},
	
	
	// evaluates a qualified expression.
	// this does nothing special, but try,catch.
	eval	: function(expr) {
		Circular.debug.write('Circular.parser.eval');
		var value = Circular.config.evalfail;
		try {
				value = eval(expr);
				Circular.debug.write("Circular.parser.eval",expr,value);
		} catch (err) {
			try {
				// maybe its an object def
				expr = '('+expr+')';
				var value = eval(expr);
				Circular.debug.write("Circular.parser.eval",expr,value);
			} catch (err) {
				Circular.log.error("Circular.parser.eval",expr,'fail',err);
			}
		}
		return value;
	},
	
	boolish	: function(str) {
		if (str) {
			if (str==='no') 		return false;
			if (str==='off') 		return false;
			if (str==='false') 	return false;
			if (str==='0') 			return false;
			return true;
		} else {
			if (str==='') return true;
			return false;
		}
	}
	
});
	
/* ----------------------
	registry
----------------------- */

new CircularModule({

	name		: 'registry',
	requires	: ['log','debug'],
	counter	: 0,
	
	newProperties 	: function() {
		return {
			'flags'	: {
				'registered'				: false,
				'watched'						: false,
				'processing'				: false,
				'processedin'				: false,
				'processedout'			: false,
				'attrsetchanged'		: true,
				'contentchanged'		: true,
				'contentchanged:p'	: 0,
				'contentchanged:i'	: false,
				'contentchanged'		: true,
				'contextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true
			},
			'outercontext'	: '',
			'innercontext'	: '',
			'attributes'		: [],		// todo: reverse naming
			'name2attr'			: {}		// todo: reverse naming
		};
	} ,
	
	newAttribute 	: function(name) {
		return {
			'name'				: name,
			'module'			: '',
			'original'		: '',
			'expression'	: '',
			'result'			: undefined,
			'value'				: '',
			'oldpaths'		: [],
			'paths'				: [],		
			'flags'			: {
				'parsed'						: false,
				'registered'				: false,
				'attrdomchanged'		: true,
				'attrdomchanged:p'	: 0,
				'attrdomchanged:i'	: false,
				'attrdatachanged'		: true,
				'attrdatachanged:p'	: 0,
				'attrdatachanged:i'	: false,
				'breaking'					: false
			}
		}
	} ,

	lock	: function(node) {
		var props = this.get(node,true);
		props.flags.locked=true;
		this.set(node,props);
	},
	
	unlock	: function(node) {
		props = $(node).data('cc-properties');
		props.flags.locked=false;
		$(node).data('cc-properties',props);
	},
	
	set	: function(node,props,watch) {
		Circular.debug.write('@registry.set');
		if (!props.flags.registered) {
			props.flags.registered = true;
			this.counter++;
		}
		for (var ac=0;ac<props.attributes.length;ac++) {
			props.attributes[ac].flags.registered=true;
		}
		if (watch) {
			Circular.debug.write('@registry.set','watch',node);
			Circular.watchdog.watch(node,props);
		}
		$(node).data('cc-properties',props);
	},
	
	get	: function(node,force) {
		// Circular.debug.write('Circular.registry.get');
		// this should perhaps return a deep copy instead ..
		var props = $(node).data('cc-properties');
		if (!props) props = this.newProperties();
		if (!props.flags.locked || force) {
			return props;
		} else {
			Circular.log.error('@registry.get','Node is locked',node);
		}
	}
	
	
	
});
	
/* ----------------------
	engine
----------------------- */

new CircularModule({

	name				: 'engine',	
	requires		: ['root','context','content','log','debug','registry'],
	config			: { 
		rootselector 	: '',
	},
	counter			: 0,
	genid				: 0,
	
	ejected			: {
		// #id : $placeholder
	},
	
	start				: function() {
		Circular.debug.write('@engine.start ');
		var rootsel = Circular.config.rootselector;
		if (!rootsel) {
			rootsel = '['+Circular.config.attrprefix+'root],';
			rootsel += '['+Circular.config.attrprefix+Circular.config.attrprefix+'root]';
		}
		var $root = $(rootsel);
		if (!$root.size()) $root = $('html');
		this.recycle($root,true);
	},
	
	recycle	: function(nodes,now) {
		Circular.debug.write('@engine.recycle ');
		if (nodes instanceof jQuery) {
			nodes = nodes.toArray();
		}
		
		if (!nodes) return this.cycle();
		
		if (!now) {
			Circular.queue(function() {
				Circular.engine.recycle(nodes,true);
			});
			return true;
		}
		//alert('recycle');
		
		this.sort(nodes);
		
		nodes.forEach(function(node) {
			// lock nodes
			Circular.registry.lock(node);
		});
		
		nodes.forEach(function(node) {
			var props = Circular.registry.get(node,true);
			if (props.flags.locked) {
				Circular.debug.write('@engine.recycle ','Recycling',node);
				this.process(node);
			} else {
				Circular.debug.write('@engine.recycle ','Node was already recycled',node,props);
			}
		},this);

		
		return true;
	},
	
	sort 				: function(nodes) {
		var sorted = [];
		if (nodes.length) {
			for (var nc=0; nc<nodes.length;nc++) {
				// create sorted array
				var inside = false;
				for (var sc=0; sc<sorted.length;sc++) {
					//console.log(nc,sc);
					if (sorted[sc].contains(nodes[nc])) {
						inside = true;
					} else {
						if (inside) {
							// bottom. insert before
							//console.log('bottom',nc,sc);
							sorted.splice(sc,0,nodes[nc]);
							break;
						} else if (nodes[nc].contains(sorted[sc])) {
							// middle. insert before
							//console.log('middle/top',nc,sc);
							sorted.splice(sc,0,nodes[nc]);
							break;
						}
					}
				}
				if (sc==sorted.length) {
					//console.log('append',nc,sc);
					sorted.push(nodes[nc]);
				}
			}
		}
		nodes=sorted;
		return sorted;
		
	},
	
	process			: function (node,context) {
		Circular.debug.write('@engine.process',node.nodeName,context);
		if (!node) {
			Circular.log.fatal('@engine.process','no node given');
		}
		if (Circular.dead) {
			Circular.log.fatal('@engine.process','Circular died :-|');
			return false;
		}
		
		this.counter++;
		
		var props = Circular.registry.get(node,true);
		props.flags.locked=true; // for new nodes
		
		if (context) {
			if (context != props.outercontext) {
				Circular.debug.write('@engine.process','context changed',props.outercontext,context,node);
				props.outercontext = context;
				props.flags.contextchanged=true;
			} else {
				Circular.debug.write('@engine.process','context not changed');
			}
		} else {
			if (!props.outercontext) {
				Circular.debug.write('@engine.process','no context: using current',node);
				props.outercontext = Circular.context.get();
			} else {
				Circular.debug.write('@engine.process','no context: using given',context,node);
			}
		}
		Circular.context.set(props.outercontext);
		
		switch(node.nodeType) {
		
			case Node.ELEMENT_NODE:
			
				if (this.processElementNode(node,props)) {
					Circular.debug.write('@engine.process','registered',node);
				} else {
					Circular.debug.write('@engine.process','ignored',node);
				}

				break;
				
			case Node.TEXT_NODE:
			
				if (this.processTextNode(node,props)) {
					Circular.debug.write('@engine.process','processed',node);
				} else {
					Circular.debug.write('@engine.process','ignored',node);
				}
				
				break;
				
			case Node.COMMENT_NODE:
			
				Circular.debug.write('@engine.process ','ignoring comments '+node.nodeType);
				break;
				
			default:
			
				Circular.debug.write('@engine.process ','ignoring node type '+node.nodeType);
		}
		
		// if it was registered along the way,
		// now is the time to let go
		if (props.flags.registered) {
			Circular.registry.unlock(node);
		}
		
	},

	processElementNode				: function(node,props) {
		Circular.debug.write('@engine.processElementNode');

		var newcontext = false;

		if (props.flags.contextchanged || props.flags.attrsetchanged || props.flags.attrdomchanged || props.flags.attrdatachanged) {
		
			//if (props.flags.attrdomchanged || props.flags.attrsetchanged ) {
				this.indexAttributes(node,props);
			//}
			
			if (props.attributes.length) {
			
				Circular.debug.write('@engine.processElementNode','processing attrs in ..',node);
				
				// evaluate and fill out attrs, execute modules
				// this will return false if one of the modules
				// return false to interrupt the cycle
				
				var recurse = this.processAttributesIn(node,props);
				
				Circular.debug.write('@engine.processElementNode','processed attrs in',node);


				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
				
				// register changes now, so the watchdog can
				// observe changes made by children
				Circular.registry.set(node,props,true);
				
				if ( recurse &&  ( newcontext || props.flags.contentchanged ) ) {
					this.processChildren(node,newcontext);
				} 
				
				Circular.debug.write('@engine.processElementNode','processing attrs out ..',node);
				this.processAttributesOut(node,props);
				Circular.debug.write('@engine.processElementNode','processed attrs out',node);
				
				// register the final version
				Circular.registry.set(node,props,true);
				
				return true;
				
			} else {
				
				// after looking at the attributes,
				// there was nothing particular, but
				
				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
				
				if (newcontext || props.flags.contentchanged) {
					
					
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (props.flags.registered) {
						Circular.registry.set(node,props,true);
					} 
					
					Circular.debug.write('@engine.processElementNode','processing content',node);
					
					this.processChildren(node,newcontext);
					
					
					Circular.debug.write('@engine.processElementNode','processed content',node);
					
					// and the final version
					
					if (props.flags.registered) {
						
						Circular.registry.set(node,props,true);
						return true;
					} else {
						return false;
					}
					
					
				} else {
					// no important attr, 
					// no new content, 
					// inner context didnt change
					
					// stop
					return false;
				}
					
			}
			
		} else {
		

			// we can ignore the attributes. but
			
			var innercontext = Circular.context.get();
			if (props.innercontext!=innercontext) {
				newcontext = props.innercontext = innercontext;
			}
			
			if (newcontext || props.flags.contentchanged) {
			
				// if this was already registered and it changed here,
				// remember that. otherwise, nothing much to remember
				
				if (props.flags.registered) {
					Circular.registry.set(node,props,true);
				} 
				
				Circular.debug.write('@engine.processElementNode','processing content',node);
				
				this.processChildren(node,newcontext);
				
				Circular.debug.write('@engine.processElementNode','processed content',node);
				
				// and the final version
				if (props.flags.registered) {
					Circular.registry.set(node,props,true);
					return true;
				} else {
					return false;
				}
				
			} else {
				// no attributes
				// no new content
				// inner context didnt change
				// stop
				return false;
			}
			
		}
		
	},
	
	indexAttributes	: function(node,props) {
		Circular.debug.write('@engine.indexAttributes');
		
		// loop all the nodes attributes
		// see if they contain expression or 
		// if they are modules. other attributes
		// are ignored.

		// the order is important here. 
		// modules should go first, so there are
		// executed before normal attributes. also,
		// the mods need to be sorted in the
		// order they were created ..
		
		// if the node was registered in a previous
		// cycle, use the original values from there
		
		var regattrs = props.attributes;
		var attrs = [], plain = [], mods = [];
		
		for(var ac=0; ac<node.attributes.length;ac++) {
			var attr = null;
			var attrname = node.attributes[ac].name;
			
			//attr = props.name2attr[attrname];
			
			// see if it was registered
			for (var ri=0;ri<regattrs.length;ri++) {
				if (regattrs[ri].name==attrname) {
					attr=regattrs[ri];
					break;
				}
			}
			
			// else, create a new property from this attribute
			if (!attr) attr = Circular.registry.newAttribute(attrname);
			
			var attrcname = Circular.modules.attr2cname[attrname];
			var modidx = Circular.modules.attr2idx[attrcname];
			if (modidx!==undefined) {
				var modname = Circular.modules.stack[modidx].name;
				if (this.indexModuleAttribute(node,attr,modname)) {
					mods[modidx]=attr;
					mods[modidx].watches = Circular.modules.stack[modidx].watches;
				}
			} else {
				if (this.indexAttribute(node,attr)) {
					plain.push(attr);
				}
			}
		}
		
		// stack these up in the right order:
		for (var idx in mods) {
			attrs.push(mods[idx]);
		}
		props.attributes = attrs.concat(plain);
		
		// now put the watches in place
		Circular.debug.write('@engine.indexAttributes','attributes pre',props.attributes);
		for (var pc=0; pc < props.attributes.length; pc++) {
			if (props.attributes[pc].watches) {
				for (var wc=0; wc<props.attributes[pc].watches.length;wc++) {
					Circular.debug.write('@engine.indexAttributes','moving watch',props.attributes[pc].watches[wc]);
					for (var pc2=0; pc2 < props.attributes.length; pc2++) {
						if (props.attributes[pc2].name==props.attributes[pc].watches[wc]) {
							Circular.debug.write('@engine.indexAttributes','found watch',props.attributes[pc].watches[wc]);
							// move props.attributes[pc2] before props.attributes[pc]
							props.attributes.splice(pc,0,props.attributes.splice(pc2,1)[0]);
							if (pc2>pc) pc++;
							break;
						}
					}
				}
			}
		}
		Circular.debug.write('@engine.indexAttributes','attributes post',props.attributes);
		
		// map them by name - youll need it
		for (var idx in props.attributes) {
			props.name2attr[props.attributes[idx].name] = props.attributes[idx];
		}
	},
	

	indexModuleAttribute			: function(node,attr,modname) {
		Circular.debug.write('@engine.indexModule',modname);
		
		
		if (this.indexAttribute(node,attr)) {
		
			attr.module=modname;
			return true;
			
		} else {
		
			// even if its not an expression, a module
			// is always registered for just being one. 
			
			if (!attr.flags.registered) {
				attr.cname		= Circular.modules.attr2cname[attr.name];
				var original 	= node.getAttribute(attr.name);
				attr.module 	= modname;
				attr.original = original;
				attr.value		= original;
				
			}
			return true;
			
		}
		
	},
	
	indexAttribute			: function(node,attr) {
		Circular.debug.write('@engine.indexAttribute',attr.name);
		
		// check if the attribute is an expression
		// update the properties of attr, but
		// dont evaluate it yet - this will happen in
		// processAttributesIn, in the right order
		
		// return true if it should be registered
		// false if it shouldnt
		
		if (attr.flags.attrdomchanged) {
		
			
			var expression = '', original = '';
			
			if (attr.name.indexOf('-debug')==-1) { // hm
			
				// the dom changed, so ignore what was registered:
				attr.original = node.getAttribute(attr.name);
				expression	= attr.expression;
				
				// parse returns an expression without {{}},
				// or an empty string if there is no expression	
				
				if (Circular.parser.parseAttribute(attr,Circular.context.get())) {

					if (Circular.debug.enabled && attr.name!='cc-debug') {
						if (attr.name.indexOf('cc-')==0) node.setAttribute('cc-'+attr.name.substring(3)+'-debug',attr.original);
						else node.setAttribute('cc-'+attr.name+'-debug',attr.original);
					}
			
					return true;
					
				} else {
				
					// so its not an expression (anymore)
					// ignore it or forget it
					
					if (Circular.debug.enabled) {
						if (attr.name.indexOf('cc-')==0) node.removeAttribute('cc-'+attr.name.substring(3)+'-debug');
						else node.removeAttribute('cc-'+attr.name+'-debug');
					}
					return false;

				}
			} else {
				// dont register debug attributes
				return false;
			}
		} else {
		
			
			
			// nothing changed, so do nothing,
			// but if it was registered, remember it
			return attr.flags.registered;
			
		}
		
	},
	
	processAttributesIn	: function(node,props) {
		Circular.debug.write('@engine.processAttributesIn',node);
		// loop all attributes forward
		// evaluate optional expressions
		// if its a module, execute mod.in. 
		// if it returns false, break
		
		//console.log('processAttributesIn',node,attrs);
		
		for (var dc=0; dc<props.attributes.length; dc++) {
		
			var attr = props.attributes[dc];
			
			if (attr.flags.attrdomchanged || attr.flags.attrdatachanged) {
				
				// (re-)eval this attribute, be it a full match
				// or  a string containing matches 
				
				var result = Circular.parser.eval(attr.expression);
				
				if (result!=attr.result) {
				
					attr.result = result;
					Circular.debug.write('@engine.processAttributesIn','changed',attr.name,attr.expression,attr.result);
					try {
						if (result===undefined) attr.value = ''; 
						else if (typeof attr.result == 'object') attr.value = attr.original;
						else attr.value = attr.result.toString();
					} catch (x) {
						attr.value = '';
						Circular.log.warn(x);
					}
					if (Circular.watchdog && props.flags.watched) {
						Circular.watchdog.pass(node,'attrdomchanged',attr.name);
					}
					node.setAttribute(attr.name,attr.value);
					//alert(attr.value);
				}
			}

			// even if it didnt change, you need to execute it
			// because it could change things for other attributes
			if (attr.module) {
				Circular.debug.write('@engine.processAttributesIn','executing',attr.module);
				var mod = Circular.modules.stack[Circular.modules.name2idx[attr.module]];
				var func = mod.in;
				if (func) {
					var ok = func.call(mod,attr,node,props);
					if (ok===false) {
						attr.flags.breaking=true;
						break;
					} else {
						attr.flags.breaking=false;
					}
				}
			} 
			
			
				
		}
		
		// return true if none (or only the last one)
		// is breaking. returning false will stop
		// recursion down the node.
		return dc==props.attributes.length;
			
		
	},
	
	processAttributesOut	: function(node,props) {
		Circular.debug.write('@engine.processAttributesOut');
		// loop all modules backwards
		// starting with the last break, if any
		for (var dc=0; dc<props.attributes.length; dc++) {
			if (props.attributes[dc].flags.breaking) {
				dc++;
				break;
			}
		}
		for (var dc=dc-1; dc>=0; dc--) {
			var attr = props.attributes[dc];
			if (attr.module) {
				Circular.debug.write('@engine.processAttributesOut','executing',attr.module);
				var mod = Circular.modules.stack[Circular.modules.name2idx[attr.module]];
				var func = mod.out;
				if (func) {
					func.call(mod,attr,node,props);
				}
			}
		}
		
	},
	
	processChildren	: function(node,context) {
		Circular.debug.write('@engine.processChildren');
		
		// traverse node depth first looking
		// for modules or expressions,
		// using the new context
		var contents = $(node).contents();
		$(contents).each(function() {
			Circular.engine.process(this,context);
		});
		
	},
	
	
	processTextNode	: function(node,props) {
		Circular.debug.write('@engine.processTextNode');
		
		if (props.flags.contentchanged) {
		
			var val = node.textContent;
			var match, exec, nodes = [];
			if (matches = Circular.parser.match(val)) {
													
				if (matches.length==1 && matches[0]==val) {
					// this is a full match
					var parent = node.parentNode;
					if (!parent.hasAttribute('cc-content')) {
						Circular.debug.write('@engine.processTextNode','setting cc-content on the parent');
						
						// ugly
						var parprops = Circular.registry.get(parent,true);
						if (parprops.flags.watched) {
							if (Circular.watchdog) {
								Circular.watchdog.pass(parent,'contentchanged');
								Circular.watchdog.pass(parent,'attrsetchanged');
							}
							parprops.flags.attrsetchanged=true;
						}
						parent.setAttribute('cc-content',val);
						parent.removeChild(node);
						this.process(parent);
					} else {					
						Circular.debug.write('@engine.processTextNode','replacing content with single span');
						var span = document.createElement('span');
						span.setAttribute('id','cc-engine-'+this.genid++);
						span.setAttribute('cc-content',val);
						if (Circular.watchdog) {
							Circular.watchdog.pass(parent,'contentchanged');
						}
						parent.insertBefore(span, node);
						parent.removeChild(node);
						this.process(span,props.outercontext);
					}

				} else {
				
					// start splitting up nodes
					Circular.debug.write('replacing content with text and spans');
					
					var vals = Circular.parser.split(val);
					for (var vc=0; vc<vals.length;vc++) {
							if (vals[vc].expression) {
								Circular.debug.write('@engine.processTextNode','inserting span '+vals[vc].expression);
								var span = document.createElement('span');
								span.setAttribute('id','cc-engine-'+this.genid++);
								span.setAttribute('cc-content',vals[vc].expression);
								nodes.push(span);
							} else {
								Circular.debug.write('@engine.processTextNode','inserting text '+vals[vc].text);
								nodes.push(document.createTextNode(vals[vc].text));
							}
					}
					
					for (var nc=0; nc < nodes.length; nc++) {
						if (Circular.watchdog) {
							Circular.watchdog.pass(node.parentNode,'contentchanged');
						}
						node.parentNode.insertBefore(nodes[nc], node);
						if (nodes[nc].nodeType==Node.ELEMENT_NODE) {
							this.process(nodes[nc],props.outercontext);
						}
					}
					
					node.parentNode.removeChild(node);
					
				}
													
			} else {
				// this text does not contain expressions
			}
		} else {
			// this text hasnt changed
		}
	},
	
	/* node management - unused  */
	
	hide	: function(node,method) {
		if (!method) method = Circular.config.hide;
		if (method=='css') $(node).addClass('cc-engine-hidden');
		else if (method=='dom') this.eject(node,'engine','hide');
	},
	
	show	: function(node,method) {
		if (!method) method = Circular.config.hide;
		if (method=='css') $(node).removeClass('cc-engine-hidden');
		else if (method=='dom') this.inject(node);
	},
	
	eject	: function(node,modname,params) {
	
		if (!modname) modname 	= this.name;
		if (!params) params			= 'eject';
		
		var $ejected = $('#cc-ejected');
		if (!$ejected.size()) {
			$('body').append('<div id="cc-ejected"></div>');
			$ejected = $('#cc-ejected');
		}
		var id = node.getAttribute('id');
		if (id==undefined) {
			id = 'cc-engine-'+this.genid++;
			node.setAttribute('id',id);
		}
		$placeholder = $('<!--@'+modname+'['+JSON.stringify(params)+'][#'+id+']-->');
		$(node).after($placeholder).appendTo($ejected);
		
		this.ejected[id] = $placeholder;
		return id;

	},
	
	inject	: function(node) {
		var id 		= node.getAttribute('id');
		var $placeholder 	= this.ejected[id];
		if ($placeholder) {
			$placeholder.before(node);
			$placeholder.remove();
			delete this.ejected[id];
		} else {
			Circular.log.error('@engine.inject','no placeholder found',id);
		}
	},
	
	detach	: function(node) {
	
	},
	
	attach	: function(node) {
	
	}
	
});


/* ----------------------
	watchdog
----------------------- */

new CircularModule({
		
	name				: 'watchdog',
	requires		: ['log','debug','registry','engine'],
	timer				: null,
	lock				: false,
	config			: {
		watchdogtimeout	: 50
	},
	
	domobserver : null,
	
	pathobservers		: {
	
		// 'full.path' : {
		//		'observer'		: new PathObserver(),
		//		'properties'	:	[
		//			{ 'node': Node, 'type':attribute, 'id':name },
		//			..
		//		]
		//	},
		//  .. 
	
	},
	
	caught	: {
		nodes		: [
			// Node,Node,..
		],
		records	: [
			// {type:type,flag:flag,target:target},
			// {type:pass,flag:attrdatachanged,target:class},..
			// {type:event,flag:attrdatachanged,target:class},..
			// {type:ignore,flag:contextchanged,target:*},..
		]
	},
	
	releasing	: {
		// copy of caught on release()
	},
	
	
	
	init	: function() {
		Circular.debug.write('Circular.watchdog.init');
		this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
	},
	
	die	: function() {
		Circular.debug.write('Circular.watchdog.die');
		this.domobserver.disconnect();
		for (path in this.pathobservers) {
			this.pathobservers[path].observer.close();
		}
		this.pathobservers = {};
	},
	
	watch	: function (node,props) {
		Circular.debug.write('Circular.watchdog.watch');
		this.watchdom(node,props);
		this.watchdata(node,props);
		
		// unset the flags youve set before recycle
		props.flags['attrsetchanged'] = false;
		props.flags['contentchanged'] = false;
		props.flags['contextchanged'] = false;
		props.flags['attrdomchanged'] = false;
		props.flags['attrdatachanged'] = false;
		for (var ac=0; ac<props.attributes.length; ac++) {
			props.attributes[ac].flags['attrdomchanged'] = false;
			props.attributes[ac].flags['attrdatachanged'] = false;
		}
		props.flags['watched'] = true;
		Circular.registry.set(node,props);
	},
	
	
	
	watchdom	: function(node,props) {
		if (!props.flags.domobserved) {
			Circular.debug.write('Circular.watchdog.watchdom',props);
			this.domobserver.observe(node, { 
				attributes				: true, 
				attributeOldValue	: true,
				childList			: true, 
				characterData	: true,
				subtree				: false
			});
			props.flags.domobserved=true;
			Circular.registry.set(node,props);
		}
	},
	
	ondomchange	: function(records,observer) {
		Circular.debug.write('Circular.watchdog.ondomchange',records);
		
		//type	String	
		//target	Node	
		//addedNodes	NodeList	
		//removedNodes	NodeList	
		//previousSibling	Node	
		//nextSibling	Node	
		//attributeName	String	
		//attributeNamespace	String	
		//oldValue	String	
		
		records.forEach(function(record) {
			switch(record.type) {
				case 'attributes':
					if (record.oldValue===null || record.target.getAttribute(record.attributeName)===null) {
						Circular.watchdog.catch(record.target,'event','attrsetchanged');
					} else {
						Circular.watchdog.catch(record.target,'event','attrdomchanged',record.attributeName);
					}
					break;
				case 'characterData':
					Circular.watchdog.catch(record.target,'event','contentchanged');
					break;
				case 'childList':
					// we have record.addedNodes .. ignoring
					// we have record.removedNodes .. ignoring ?
					Circular.watchdog.catch(record.target,'event','contentchanged');
					break;
				default:
					Circular.log.error('Circular.watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	
	watchdata	: function(node,props) {
		if (props.flags.attrdomchanged) {
			Circular.debug.write('Circular.watchdog.watchdata',node,props);
			
			props.attributes.forEach(function(attr,idx) {
				if (attr.flags.attrdomchanged) {
					if (attr.paths) {
						var ignorepaths = [];
						if (!attr.oldpaths) attr.oldpaths = [];
						
						// remove old paths
						if (attr.oldpaths.length) {
							attr.oldpaths.forEach(function(oldpath) {
								if (this.pathobservers[oldpath]) {
									if (attr.paths.indexOf(oldpath)==-1) {
										Circular.debug.write('Circular.watchdog.watchdata','removing  path',oldpath);
										var object=null,subpath='';
										var split = oldpath.indexOf('.');
										if (split!=-1) subpath = oldpath.substring(split+1)
										if (subpath) {
											for (var pc=0;pc<this.pathobservers[oldpath].properties.length;pc++) {
												var property = this.pathobservers[oldpath].properties[pc];
												if (property && property.node==node && property.type=='attribute' && property.id == attr.name) {
													delete this.pathobservers[oldpath].properties[pc];
													if (!this.pathobservers[oldpath].properties.length) {
														Circular.debug.write('Circular.watchdog.watchdata','closing pathobserver',oldpath);
														this.pathobservers[oldpath].observer.close();
														delete this.pathobservers[oldpath];
													}
												}
											}
										} else {
											Circular.log.error('Circular.watchdog.watchdata','cant split path '+path);
										}
									}
								}
							},this);
							attr.oldpaths = [];
						} 
						
						// add new paths
						attr.paths.forEach(function(path) {
							if (attr.oldpaths.indexOf(path)==-1) {
								Circular.debug.write('Circular.watchdog.watchdata','adding path',path);
								var object=null,subpath='';
								var split = path.indexOf('.');
								if (split==-1) {
									Circular.log.warn('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
								} else {
									object 	= Circular.parser.eval(path.substring(0,split));
									subpath = path.substring(split+1)
								}
								if (object && subpath) {
									var property = {
										'node'		:	node,
										'type'		: 'attribute',
										'id'			: attr.name
									};
									if (!this.pathobservers[path]) {
										if (object !== window) {
											this.pathobservers[path] = {
												'observer'	: new PathObserver(object,subpath),
												'properties': [property]
											};
											this.pathobservers[path].observer.open(function(newvalue,oldvalue) {
												Circular.watchdog.ondatachange(path,newvalue,oldvalue)
											});
										} else {
											Circular.log.warn('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
										}
									} else {
										this.pathobservers[path].properties.push(property);
									}
								} else {
									Circular.log.error('Circular.watchdog.watchdata','cant split path ',path);
								}
							} else {
								Circular.debug.write('Circular.watchdog.watchdata','path already watched',path);
							}
						},this);
					}
				}
			},this);
		}
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		Circular.debug.write('Circular.watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.catch(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('Circular.watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		//Circular.debug.write('Circular.watchdog.pass');
		this.catch(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		//Circular.debug.write('Circular.watchdog.ignore');
		this.catch(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		//Circular.debug.write('Circular.watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.catch(node,'unignore',event,target);
	},

	catch	: function(node,type,flag,target) {
		Circular.debug.write('Circular.watchdog.catch',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.caught.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.caught.nodes.length;
			this.caught.nodes.push(node);
		}
		if (!this.caught.records[nodeidx]) {
			this.caught.records[nodeidx] = [];
		}
		this.caught.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.queue(function() {
				Circular.watchdog.release();
			});
		}, Circular.config.watchdogtimeout);
		
	},
	
	release	: function() {
	
		Circular.debug.write('Circular.watchdog.release');

		// copy & clean caught to releaseing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('Circular.watchdog.release','found lock: another watchdog seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.releasing,this.caught);
		this.caught.nodes = [];
		this.caught.records = [];
		
		for (var nc=0;nc<this.releasing.nodes.length;nc++) {
			var node			= this.releasing.nodes[nc];
			var records 	= this.releasing.records[nc];
			var props 		= Circular.registry.get(node);
			
			// {type,flag,target}
			for (var rc=0; rc<records.length;rc++) {
				var record = records[rc];
				var processing = false;
				switch (record.type) {
					case 'event' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
									
										if (props.name2attr[record.target].flags[record.flag+':i']) {
											Circular.debug.write('Circular.watchdog.release','attr ignoring flag',record.flag);
											break;
										}
										if (props.name2attr[record.target].flags[record.flag+':p']) {
											Circular.debug.write('Circular.watchdog.release','attr passing flag',record.flag);
											props.name2attr[record.target].flags[record.flag+':p']--;
											break;
										}
										Circular.debug.write('Circular.watchdog.release',record.flag,record.target,node);
										props.name2attr[record.target].flags[record.flag]=true;
										props.flags[record.flag]=true;
										processing=true;
									} else {
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
							
								if (props.flags['contentchanged:i']) {
									Circular.debug.write('Circular.watchdog.release','node ignoring contentchanged');
									break;
								}
								if (props.flags['contentchanged:p']) {
									Circular.debug.write('Circular.watchdog.release','node passing contentchanged');
									props.flags['contentchanged:p']--;
									break;
								}
								Circular.debug.write('Circular.watchdog.release','contentchanged',record,node);
								props.flags['contentchanged']=true;
								processing=true;
								break;
								
							case 'attrsetchanged':
							
								if (props.flags['attrsetchanged:i']) {
									Circular.debug.write('Circular.watchdog.release','node ignoring attrsetchanged');
									break;
								}
								if (props.flags['attrsetchanged:p']) {
									Circular.debug.write('Circular.watchdog.release','node passing attrsetchanged');
									props.flags['attrsetchanged:p']--;
									break;
								}
								Circular.debug.write('Circular.watchdog.release','attrsetchanged',record,node);
								props.flags['attrsetchanged']=true;
								processing=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'pass' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':p']++;
									} else {
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
								props.flags['contentchanged:p']++;
								break;
							
							case 'attrsetchanged':
								props.flags['attrsetchanged:p']++;
								break;
								
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'ignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=true;
									} else {
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=true;
								break;
								
							case 'attrsetchanged':
								props.flags['attrsetchanged:i']=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'unignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=false;
									} else {
										Circular.debug.write('Circular.watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.release','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('Circular.watchdog.release','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (!processing) {
				delete this.releasing.nodes[nc];
				delete this.releasing.records[nc];
			} else {
				Circular.registry.set(node,props);
				Circular.registry.lock(node);
			}
		};
		
		// make hte array unsparse
		var todo = [];
		this.releasing.nodes.forEach(function(node) { todo.push(node); });
		if (todo.length) {
			Circular.debug.write('recycling '+todo.length+' nodes');
			if (Circular.debug.enabled) this.report(this.releasing);		
			Circular.engine.recycle(todo,true);
		}
		this.releasing = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.caught;
		Circular.log.write('Circular.watchdog.report');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
	}

	
	
	
		
});
	

/* ----------------------
	hide
----------------------- */

new CircularModule({

	name				: 'hide',
	attributes	: ['cc-hide','cc-show'],
	requires		: ['debug','engine'],
	css					: '.cc-hide { display:none; }',

	in	: function(attr,node,props) {
		Circular.debug.write('@hide.in',node);
		if (Circular.parser.boolish(attr.value)) {
			if (Circular.modules.attr2cname[attr.name]=='cc-show') {
				this.show(node);
				return true;
			} else {
				this.hide(node);
				return false;
			}
		} else {
			if (Circular.modules.attr2cname[attr.name]=='cc-show') {
				this.hide(node);
				return false;
			} else {
				this.show(node);
				return true;
			}
		}
	},
	hide	: function(node) {
		$(node).addClass('cc-hide');
	},
	show	: function(node) {
		$(node).removeClass('cc-hide');
	}
	
		
});





/* ----------------------
	template
----------------------- */

new CircularModule({

	name				: 'template',
	requires		: ['debug','engine'],
	attributes	: ['cc-template'],
	css					: '.cc-template, [cc-template=""]{ display:none; }',

	orgattr			: 'cc-template-origin',
	
	in	: function(attr,node,props) {
		Circular.debug.write('@template.in',node);
		var tplsel = attr.value;
		var $node = $(node);
		if (tplsel) {
			// include the template if it isnt already
			if (!$node.children('['+this.orgattr+'="'+tplsel+'"]').size()==1) {
				var $tpl = $(tplsel);
				if ($tpl.size()) {
					Circular.watchdog.pass(node,'contentchanged');
					$node.empty().addClass('cc-template-included');
					$tpl.clone().appendTo($node)
						.removeAttr('id')
						.removeAttr('cc-template')
						.attr(this.orgattr,tplsel)
						.addClass('cc-template-clone');
				} else {
					Circular.log.error('@template.in','no such template',tplsel);
				}
			} else {
				Circular.debug.write('@template.in','already included');
			}
			
		} else {
			// this is a template, ignore
			Circular.debug.write('@template.in','is a template');
			$node.addClass('cc-template');
			return false;
		}
	}

	
		
});





/* ----------------------
	template
----------------------- */

new CircularModule({

	name				: 'loop',
	requires		: ['debug','template'],
	attributes	: ['cc-loop'],
	watches			: ['cc-loop-offset', 'cc-loop-limit' ],
	css					: '.cc-loop-template { display:none; } .cc-loop-expired, .cc-loop-item {} ',


	genid		: 0,
	offset	: 0,
	limit		: 0,
	index		: 0,
	key			: undefined,
	first		: false,
	last		: false,
	
	in	: function(attr,node,props) {

		Circular.debug.write('@loop.in',node);
		
		var $node = $(node);
		
		// make sure it has an id
		var nodeid = $node.attr('id');
		if (!nodeid) {
			nodeid = 'cc-loop-'+this.genid++;
			$node.attr('id',nodeid);
		}
		
		
		
		// find a template or make one
		var $template = $node.children('.cc-loop-template');
		if (!$template.size()) {
			Circular.debug.write('@loop.in','creating template');
			Circular.watchdog.pass(node,'contentchanged');
			if ($node.children().size()==1 && $node.contents().size()==1) {
				$template = $node.children().addClass('cc-loop-template').attr('cc-template','');
			} else {
				Circular.debug.write('@loop.in','adding template wrapper');
				$node.contents().wrapAll('<div cc-template class="cc-loop-template"></div>');
				$template = $node.children('.cc-loop-template');
			}
		}
		
		// mark all other children expired
		$node.children(':not(.cc-loop-template)').addClass('cc-loop-expired');

		// check for offset and limit
		this.offset = $node.attr('cc-loop-offset')*1;
		if (!this.offset) this.offset =0;
		this.limit = $node.attr('cc-loop-limit')*1;
		if (!this.limit) this.limit=0;
		
		
		
		// see what we have to loop
		var keys = [];
		if (!this.limit) {
			keys = Object.keys(attr.result).slice(this.offset);
		} else {
			keys = Object.keys(attr.result).slice(this.offset,this.offset+this.limit);
		}
		
		Circular.debug.write('@loop.in',attr.result,keys,'offset '+this.offset+', limit '+this.limit);
		
		this.index 	= 0;
		this.first 	= true;		
		for (var kc=0; kc<keys.length; kc++) {
			Circular.debug.write('@loop.in','index '+this.index,keys[kc]);
			this.key = keys[kc];
			this.last = (kc==keys.length-1);
			var context = '('+attr.expression+')["'+keys[kc]+'"]';
			var itemid = nodeid+'-item-'+keys[kc];
			
			// you cant do this. if there are expressions
			// anywhere inside the template that are not being
			// watched, they will not be reprocessed because
			// the context didnt change. in particular, @loop.index
			// and friends will be wrong
			
			//$item = $node.children('#'+itemid+'.cc-loop-item');
			//if ($item.size()) {
			//	// we already have it. just move it in place 
			//	Circular.debug.write('@loop.in','moving old item');
			//	Circular.watchdog.pass(node,'contentchanged');
			//	$item.appendTo($node).removeClass('cc-loop-expired');
			//	console.log('moving in place',$item);
			//	console.log(context,Circular.registry.get($item)['outercontext']);
			//	Circular.debug.on();
			//	Circular.engine.process($item.get(0),context);
			//	Circular.debug.off();
			//	console.log(context,Circular.registry.get($item)['outercontext']);
			//} else {
				// clone the template 
				Circular.debug.write('@loop.in','creating new item');
				Circular.watchdog.pass(node,'contentchanged');
				$item = $template.clone().appendTo($node)
					.removeClass('cc-loop-template cc-template')
					.removeAttr('cc-template')
					.addClass('cc-loop-item')
					.attr('id',itemid);
				Circular.engine.process($item.get(0),context);
				
			//}
			this.first = false;
			this.index++;
		}
		
		// remove all the expired kids
		Circular.watchdog.pass(node,'contentchanged');
		$node.children('.cc-loop-expired').remove();
		Circular.debug.write('@loop.in done');
		return false;
	}
	
	
		
});



