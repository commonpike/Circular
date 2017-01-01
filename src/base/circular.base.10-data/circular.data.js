
/* ----------------------
	data
----------------------- */

new CircularModule('data',{

	config	: {
	
	},
	
	attributes	: {
	
		'cc-data' : {
			in : function(ccattr,ccnode,node) {
				Circular.log.debug('@data','cc-data.in',node);
				Circular.data.processCCData(ccattr,ccnode,node);		
				
			}
		},
		'cc-data-target'	: {
			// ignore
		}
		
	},
	
	init	: function() {
		
	},
	
	// ----------
	
	
	stack	: [],
	
	processCCData	: function(ccattr,ccnode,node) {
		var source = this.getSource(ccattr,ccnode,node);
		var target = this.getTarget(ccattr,ccnode,node);
		Circular.context.set(target);
		if (source && target) {
			this.load(source,target);
		} else {
			Circular.log.error('@data','processCCData','missing source or target');
		}
	},
	
	getSource	: function(ccattr,ccnode,node) {
		var source = false;
		if (ccattr.content.expression) {
			source = ccattr.content.result;
			Circular.log.debug('@input','getSource','expression');
		} else source = ccattr.content.value; 
		return source;
	},
	
	getTarget	: function(ccattr,ccnode,node) {
		var target=false;
		var targetname = Circular.modules.prefix('cc-data-target');
		if (ccnode.attributes[targetname]) {
			if (ccnode.attributes[targetname].content.expression) {
				target = ccnode.attributes[targetname].content.expression;
				Circular.log.debug('@input','getTarget','expression',target);
			} else if (ccnode.attributes[targetname].content.value) {
				target = ccnode.attributes[targetname].content.value;
				Circular.log.debug('@input','getTarget','value',target);
			}
		}
		if (!target) {
			target = 'Circular.data.stack['+Circular.data.stack.length+']';
			Circular.log.debug('@input','getTarget','implied',target);
			Circular.queue.add(function() {
				$(node).attr(targetname,target);
			});
		}
		
		targetval = Circular.parser.eval(target);
		if (targetval===undefined) {
			Circular.log.debug('@data','getTarget','assigning empty object');
			Circular.parser.eval(target+'={}');
		}
		return target;
	},
	
	load	: function(arg,target) {
	
		$.ajax(arg).done(function(data) {
			Circular.log.debug('@data','load',arg,'success');
			// convert to json
			try {
				var object = JSON.parse(data);
				// assign
				Circular.data.cache=object;
				Circular.parser.eval(target+'=jQuery.extend(true, {}, Circular.data.cache);');
			} catch(e) {
				Circular.log.error('@data','load','return value does not seem json object');
			}
		}).fail(function(data) {
			Circular.log.debug('@data','load','fail',data);
			
		});
	}
		
});



