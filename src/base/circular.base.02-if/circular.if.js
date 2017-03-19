
/* ----------------------
	@if
----------------------- */

new CircularModule('if',{

	
	
	attributes	: {
	
		'cc-if' : {
			in	: function(ccattr,ccnode,node) {
				
				// see if there is an else
				if (ccnode.flags.pristine) {
					var $else = $(node).siblings('[cc-else]').eq(0);
					if ($else.size()) {
						var enid=Circular.engine.nodeid($else);
						Circular.log.debug('@if','cc-if','found else',enid);
						ccattr.properties.elseref='#'+enid;
					}
				}
				
				// update else if needed
				if (ccattr.flags.attrdomchanged && ccattr.properties.elseref) {
					Circular.log.debug('@if','cc-if','updating else');
					$(ccattr.properties.elseref).attr(Circular.modules.prefix('cc-else'),ccattr.content.original);
				}
				
				// manage if
				if (ccattr.content.value!=='' && Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@if','cc-if','eject.unflag',node);
					Circular.eject.unflag(node,ccnode,'cc-if');
					return true;
				} else {
					Circular.log.debug('@if','cc-if','eject.flag',node);
					Circular.eject.flag(node,ccnode,'cc-if');
					return false;
				}
			},
			insert	: function(ccattr,ccnode,node) {
				Circular.log.debug('@content','attributes.cc-if.insert');
				var value = (!!ccattr.content.value).toString();	
				if (node.getAttribute(ccattr.properties.name)!=value) {
					if (Circular.watchdog  && ccnode.flags.watched ) { // watched was commented ?
						Circular.watchdog.pass(node,'attrdomchanged',ccattr.properties.name);
					}
					node.setAttribute(ccattr.properties.name,value);
				}
			}	
		},
		
		'cc-else': {
			in	: function(ccattr,ccnode,node) {
				
				// manage else
				if (ccattr.content.value==='' || !Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@if','cc-else','eject.unflag',node);
					Circular.eject.unflag(node,ccnode,'cc-else');
					return true;
				} else {
					Circular.log.debug('@if','cc-else','eject.flag',node);
					Circular.eject.flag(node,ccnode,'cc-else');
					return false;
				}
				
			},
			set	: function(ccattr,ccnode,node) {
				Circular.log.debug('@content','attributes.cc-else.set');
				var value = (!!ccattr.content.value).toString();	
				if (node.getAttribute(ccattr.properties.name)!=value) {
					if (Circular.watchdog  && ccnode.flags.watched ) { // watched was commented ?
						Circular.watchdog.pass(node,'attrdomchanged',ccattr.properties.name);
					}
					node.setAttribute(ccattr.properties.name,value);
				}
			}	
		}
	}
	
	
		
});



