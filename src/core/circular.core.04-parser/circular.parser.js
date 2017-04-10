

/* ----------------------
	parser
----------------------- */

new CircularModule('parser', {
	
	config				: {
		// exprregex		:	/{{([^}]*?)}}/g,
		// exprregex		:	/{({|\[)([^}\]]*?)(}|\])}/g,
		// exprregex 		: /{({|\[)(.*?(?=[}\]]}))(}|\])}/g,
		// exprregex		: /{[{\[]([\s\S]*?(?=[}\]]}))[}\]]+}/g,
		exprregex				: /{{([\s\S]*?(?=}}))}}/g,
		flagregex				: /\|[spewi]+$/,
		uriregex				: /(?:^[a-z][a-z0-9+.-]*:|\/\/)/i,
		evalfail				: undefined,
		rootscope				: 'window', // bad idea
		boolish					: {
			false : ['no','off','false','0'], 
			true : ['yes','on','true','1','']
		},
		defflags				: {
			silent		: true,
			parse			: true,
			evaluate	: true,
			watch			: true,
			insert		: true
		},
		debug						: false
	},
	
	settings 			: {
	
	},

	attributes		: [],
	
	init					: function() { return true; }, 
	
	// ------------------	
	
	requires	: ['log'],
	
	
	// requires esprima.
	// @see http://esprima.org/demo/parse.html
	
	
	getPaths :	function(expression,silent) {
		this.debug('@parser.getPaths',expression);
		var ast = null;
		try {
			ast = esprima.parse(expression);
		} catch (e) {
			// thats not valid javascript. perhaps its an object def
			try {
        ast = esprima.parse('var foo='+expression);
    	} catch (e) {
        // its not json either
        if (!silent) {
        	Circular.log.error('@parser.getPaths',expression,'not ecmascript, not an object def');
        	throw(e);
        } 
    	}
		}
		
		if (ast) {
			this.debug('@parser.getPaths',ast);
			var paths = new Array();
			this.recursePaths(ast,paths);
			return paths;
		} else return false;
	},
	
	recursePaths	: function(tree,paths,path) {
	
		this.debug('@parser.recursePaths',paths,path);
		
		if (!tree || !paths) return false;
		if (tree.type =='Identifier') {

			// some sort of global
			this.debug('@parser.recursePaths','adding identifier '+tree.name);
			paths.push(this.config.rootscope+'.'+tree.name);

		} else if (tree.type=="ThisExpression") {
		
			// ignore any subpaths of 'this'
			paths.push('this');
			
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
					this.debug('@parser.recursePaths','adding path '+tree.object.name+path);
					
					if (path.indexOf('.')===0) {
						paths.push(tree.object.name+'.'+path.substring(1));
					} else {
						paths.push(this.config.rootscope+'.'+tree.object.name+path);
					}
					
				} else if (tree.object.type=='ThisExpression') {
					
					Circular.log.write('@parser.recursePaths','adding path this, ignoring subs');
					
					// ignore any subpaths of 'this'
					paths.push('this');
					
				} else {
					if (tree.object.type=='MemberExpression') {
						
						// like foo.bar.quz ; recurse the object
						this.debug('@parser.recursePaths','recursing member expression ..');
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
					this.debug('@parser.recursePaths','adding identifier '+tree.object.name);
					paths.push(this.config.rootscope+'.'+tree.object.name);
					this.recursePaths(tree.property);	
					
				} else if (tree.object.type=='ThisExpression') {
					
					Circular.log.write('@parser.recursePaths','adding path this');
					paths.push('this');
					// dont recurse this
					
				} else {
				
					// like foo.bar[quz(raz)] ; recurse both
					this.debug('@parser.recursePaths','recursing member expression ..');
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
		
			this.debug('@parser.recursePaths','other tree.type ',tree.type);
		
			// unknown garbage. dig deeper.
			var ccnode = Object.getOwnPropertyNames(tree);
			for (var pc=0; pc<ccnode.length; pc++) {
				var key = ccnode[pc];
				if (typeof tree[key] == 'object') {
					if (Array.isArray(tree[key])) {
						for (var kc=0;kc<tree[key].length;kc++) {
							this.debug('@parser.recursePaths','recursing '+key+':'+kc);
							this.recursePaths(tree[key][kc],paths);
						}
					} else {
						this.debug('@parser.recursePaths','recursing '+key,tree[key]);
						this.recursePaths(tree[key],paths);
						
					}
				} else {
					this.debug('@parser.recursePaths','ignoring '+key);
				}
				
			}
		}
		
	},
	
	
	hasExpression	: function(expr) {
		// quick way to check - false pos are ok
		return (expr.indexOf('{{')!=-1 && expr.indexOf('}}')!=-1);
	},
	
	match	: function(expr) {
		// returns an array of matches or false
		this.debug('@parser.match',expr);
		return expr.match(this.config.exprregex);
	},
	
	replace	: function(expr,func) {
		// opertes func replace on combined expressions
		this.debug('@parser.replace',expr);
		return expr.replace(this.config.exprregex,func);
	},
	
	
	
	// split a text into an array
	// of plain text string and {{expressions}}
	split	: function(text) {
		this.debug('@parser.split',text);
		var exec; var result = []; 
		var cursor = 0;
		while (exec = this.config.exprregex.exec(text)) {
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
	
	
	// if you want the result in the context of a node,
	// call it like @parser.result.call(node,expr,ctx)	
	result	: function(expr,ctx,checkflags,stripbrackets) {
		// parse a single expression
		var parsed = Circular.parser.parse(expr,ctx,checkflags,stripbrackets);
		var silent = this.config.defflags.silent;
		if (checkflags) {
			parsed = parsed.processed;
			silent = parsed.flags.silent;
		}
		return Circular.parser.eval.call(this,parsed,silent);
	},
	
	
	
	parse	: function(expr,ctx,checkflags,stripbrackets) {
		// parse a single expression. if checkflags is 
		// passed ,this return an object
		if (stripbrackets) {
			expr=expr.substring(2,expr.length-2);
		}
		if (checkflags) {
			var result 	= this.checkFlags(expr);
			if (result.flags.parse) {
				result.processed = result.processed.replace(/\$this/g,'$(this)');
				result.processed = result.processed.replace(/#this/g,ctx);
				result.processed = result.processed.replace(/#/g,ctx+'.');
				result.processed = result.processed.replace(/@/g,'Circular.');
			} 
			return result;
		} else {
			var processed = expr.replace(/\$this/g,'$(this)');
			processed = processed.replace(/#this/g,ctx);
			processed = processed.replace(/#/g,ctx+'.');
			processed = processed.replace(/@/g,'Circular.');
			return processed;
		}
	},
	
	checkFlags	: function(expr) {
		
		var matches = expr.match(this.config.flagregex);
		if (matches) {
			return {
				processed: expr.substring(0,expr.length-matches[0].length),
				flags: {
					silent		: (matches[0].indexOf('s')!=-1),
					parse			: (matches[0].indexOf('p')!=-1),
					evaluate	: (matches[0].indexOf('e')!=-1),
					watch			: (matches[0].indexOf('w')!=-1),
					insert		: (matches[0].indexOf('i')!=-1)
				}
			}
		}
		return {
			processed	: expr,
			flags	: {
				silent		: this.config.defflags.silent,
				parse			: this.config.defflags.parse,
				evaluate	: this.config.defflags.evaluate,
				watch			: this.config.defflags.watch,
				insert		: this.config.defflags.insert
			}
		}
	},
	
	
	
	eval	: function(expr,silent) {
		Circular.parser.debug('@parser.eval');
		// evaluates a qualified expression.
		// this does nothing special, but try,catch.
		// if you want to eval this in the context of a node,
		// call it like parser.eval.call(node,expr)

		var value = Circular.parser.config.evalfail;
		try {
				value = eval(expr);
				Circular.parser.debug("@parser.eval",expr,value);
		} catch (err) {
			try {
				// maybe its an object def
				expr = '('+expr+')';
				var value = eval(expr);
				Circular.parser.debug("@parser.eval",expr,value);
			} catch (err) {
				if (!silent) {
					Circular.log.error("@parser.eval",expr,'fail',err);
					throw(err);
				}
			}
		}
		return value;
	},
	
	parseval	: function(original,ctx,silent) {
		this.debug('@parser.parseval',original);
		
		// parses *and* evaluates the original into a result:
		
		// checks if the original is an {{expression|pewi}}
		// if flags parse, parses original 
		// if flags evaluate, evaluates the expression
		// if not an expressions, evaluates too
		// does NOT watch any paths.
		
		var evaluate	= true;
		var result 		= original;
		var expression = '';
		var matches = this.match(original);
		if (matches) {
			if (matches[0]===original) {

				// this is a single full expression "{{#foo|we}}"
			
				var parsed = this.parse(original,ctx,true,true);
				expression 	= parsed.processed;
				evaluate		= parsed.flags.evaluate;
				
								
			} else {
			
				// this is a stringlike thing, "foo {{#bar|pew}} quz"
				// all expressions must always be evaluated
				// any watched paths in any expression will watch that path
				// for the whole attribute.

				expression = this.replace(original,function(match,inner) {
				
					var parsed = this.parse(original,ctx,true);
					return '"+('+parsed.processed+')+"';
					
				});
				// tell eval that this is a stringthing
				expression = '"'+expression+'"';
				evaluate = true;

			}			
			
			if (evaluate) result = this.eval(expression,silent);
			else result = expression;
			
			this.debug("@parser.parseval",original,expression,result);
			
			
		} else {
			this.debug('@parser.parseval','not an expression');
			result = this.eval(original,silent);
		}
		
		return result;
	},
	
	boolish	: function(str) {
		if (this.config.boolish[false].indexOf(str)!=-1) return false;
		if (this.config.boolish[true].indexOf(str)!=-1) return true;
		if (str) return true;
		else return false;
		
	},
	
	parseURI	: function(str,base) {
		if (this.config.uriregex.test(str)) return uri;
		if (str.indexOf('/')==0) return document.location.origin+str;
		if (str.indexOf('./')==0) return document.location.origin+base+str.substring(1);
		return false;
	},
	
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}	
	
});
	