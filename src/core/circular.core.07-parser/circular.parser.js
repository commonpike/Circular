

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
	
	/*parse	: function(expr,ctx) {
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
	},*/
	
	parseAttribute	: function(attr,ctx) {
		Circular.debug.write('Circular.parser.parseAttribute',attr.original);
		
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
					if (attr.paths) attr.oldpaths = attr.paths.slice(0); // copy
					attr.paths = [];
					for (var wc=0; wc<watches.length;wc++) {
						attr.paths = attr.paths.concat(this.getPaths(watches[wc]));
					}
				}
			}
			
			attr.flags.parsed = true;
			Circular.debug.write("Circular.parser.parseAttribute",attr.original,ctx,attr.expression);
			return true;
			
		} else {
			Circular.debug.write('Circular.parser.parseAttribute','no match');
			if (attr.expression) {
				// the expression is new or changed. need to remove paths
				attr.expression = '';
				if (attr.paths) attr.oldpaths = attr.paths.slice(0);
				attr.paths 	= [];
			}
			
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
	