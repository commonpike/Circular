

/* ----------------------
	parser
----------------------- */

new CircularModule({
	
	name			: 'parser',
	requires	: ['log','debug'],
	config		: {
		exprregex				:	/{{([^}]*?)}}/g,
		evalfail				: undefined,
		rootscope				: 'window' // bad idea
	},
	
	// requires esprima.
	// @see http://esprima.org/demo/parse.html
	
	
	getPaths :	function(expression) {
		Circular.debug.write('Circular.parser.getPaths',expression);
		var ast = esprima.parse(expression);
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
	
	// parse a string including {{moustaches}}, returning a
	// qualified expression without {{moustaches}} in which
	// context expressions have been replaced.
	parse	: function(expr,ctx) {
		Circular.debug.write('Circular.parser.parse',expr);
		matches = expr.match(Circular.config.exprregex);
		if (matches) {
			//console.log(matches[0],expr);
			if (matches[0]===expr) {
				// this is a single full expression "{{#foo}}"
				parsed = expr.substring(2,expr.length-2);
				parsed = parsed.replace(/#/g,ctx+'.');
				parsed = parsed.replace(/@/g,'Circular.');
			} else {
				// this is a stringlike thing, "foo {{#bar}}"
				var parsed = expr.replace(Circular.config.exprregex,function(match,inner) {
					inner = inner.replace(/#/g,ctx+'.');
					inner = inner.replace(/@/g,'Circular.');
					return '"+('+inner+')+"';
				});
				// tell eval that this is a stringthing
				parsed = '"'+parsed+'"';
			}
			Circular.debug.write("Circular.parser.parse",expr,ctx,parsed);
			return parsed;
		} 
		return '';
	},
	
	
	// evaluates a qualified expression.
	// this does nothing special, but try,catch.
	eval	: function(expr) {
		Circular.debug.write('Circular.parser.eval');
		try {
				var value = eval(expr);
				Circular.debug.write("Circular.parser.eval",expr,value);
				return value;
		} catch (err) {
				Circular.log.error("Circular.parser.eval",expr,'fail');
				return Circular.config.evalfail;
		}
	}
});
	