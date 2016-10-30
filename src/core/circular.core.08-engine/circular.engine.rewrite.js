

	processElementNode				: function(node,props) {
		Circular.log.debug('@engine.processElementNode');

		var newcontext = false;

		if (props.flags.contextchanged || props.flags.attrsetchanged || props.flags.attrdomchanged || props.flags.attrdatachanged) {
		
			//if (props.flags.attrdomchanged || props.flags.attrsetchanged ) {
				this.indexAttributes(node,props);
			//}
			
			if (props.attributes.length) {
			
				Circular.log.debug('@engine.processElementNode','processing attrs in ..',node);
				
				// evaluate and fill out attrs, execute modules
				// this will return false if one of the modules
				// return false to interrupt the cycle
				
				var recurse = this.processAttributesIn(node,props);
				
				Circular.log.debug('@engine.processElementNode','processed attrs in',node);


				var props.innercontext = Circular.context.get();
				if (props.props.innercontext!=props.innercontext) {
					newcontext = props.props.innercontext = props.innercontext;
				}
				
				// register changes now, so the watchdog can
				// observe changes made by children
				Circular.registry.set(node,props,true);
				
				if ( recurse &&  ( newcontext || props.flags.contentchanged ) ) {
					this.processChildren(node,newcontext);
				} 
				
				Circular.log.debug('@engine.processElementNode','processing attrs out ..',node);
				this.processAttributesOut(node,props);
				Circular.log.debug('@engine.processElementNode','processed attrs out',node);
				
				// register the final version
				Circular.registry.set(node,props,true);
				
				return true;
				
			} else {
				
				// after looking at the attributes,
				// there was nothing particular, but
				
				var props.innercontext = Circular.context.get();
				if (props.props.innercontext!=props.innercontext) {
					newcontext = props.props.innercontext = props.innercontext;
				}
				
				if (newcontext || props.flags.contentchanged) {
					
					
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (props.flags.registered) {
						Circular.registry.set(node,props,true);
					} 
					
					Circular.log.debug('@engine.processElementNode','processing content',node);
					
					this.processChildren(node,newcontext);
					
					
					Circular.log.debug('@engine.processElementNode','processed content',node);
					
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
			
			var props.innercontext = Circular.context.get();
			if (props.props.innercontext!=props.innercontext) {
				newcontext = props.props.innercontext = props.innercontext;
			}
			
			if (newcontext || props.flags.contentchanged) {
			
				// if this was already registered and it changed here,
				// remember that. otherwise, nothing much to remember
				
				if (props.flags.registered) {
					Circular.registry.set(node,props,true);
				} 
				
				Circular.log.debug('@engine.processElementNode','processing content',node);
				
				this.processChildren(node,newcontext);
				
				Circular.log.debug('@engine.processElementNode','processed content',node);
				
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