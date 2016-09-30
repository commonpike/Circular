

/* ----------------------
	watchdog
----------------------- */

new CircularModule({
		
	name				: 'watchdog',
	requires		: ['log','debug','registry','engine'],
	timer				: null,
	lock				: false,	// watchdog is locked while releasing
	config			: {
		watchdogtimeout		: 50,
		watchdogmuinterval: 500
	},
	
	
	
	domobserver 		:	null,
	countdobs				: 0,
	
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
	countpobs				: 0,

	eventsin	: {
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
	
	eventsout	: {
		// copy of eventsin on release()
	},
	
	
	
	init	: function() {
		Circular.debug.write('@watchdog.init');
		this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
		if (!Object.observe) {
			Circular.log.warn('@watchdog.init','emulating object.observe');
			setInterval(function() {
				Platform.performMicrotaskCheckpoint();
			},Circular.config.watchdogmuinterval);
		}
	},
	
	die	: function() {
		Circular.debug.write('@watchdog.die');
		this.domobserver.disconnect();
		for (path in this.pathobservers) {
			this.pathobservers[path].observer.close();
		}
		this.pathobservers = {};
	},
	
	watch	: function (node,ccnode) {
		Circular.debug.write('@watchdog.watch');
		if (!ccnode) ccnode = Circular.registry.get(node);
		if (node instanceof jQuery) node = node.get(0);
		this.watchdom(node,ccnode);
		this.watchdata(node,ccnode);

		
		// unset the flags youve set before recycle
		ccnode.flags['processing'] = false;
		ccnode.flags['attrsetchanged'] = false;
		ccnode.flags['contentchanged'] = false;
		ccnode.flags['contextchanged'] = false;
		ccnode.flags['attrdomchanged'] = false;
		ccnode.flags['attrdatachanged'] = false;
		for (var ac=0; ac<ccnode.attributes.length; ac++) {
			ccnode.attributes[ac].flags['attrdomchanged'] = false;
			ccnode.attributes[ac].flags['attrdatachanged'] = false;
		}
		ccnode.flags['watched'] = true;
		// needed if watch is called from outside ..
		Circular.registry.set(node,ccnode);

	},
	
	
	
	watchdom	: function(node,ccnode) {
		if (!ccnode.flags.domobserved) {
			Circular.debug.write('@watchdog.watchdom',ccnode);
			this.domobserver.observe(node, { 
				attributes				: true, 
				attributeOldValue	: true,
				childList			: true, 
				characterData	: true,
				subtree				: false
			});

			ccnode.flags.domobserved=true;
			this.countdobs++;
			// no need to do this here
			// Circular.registry.set(node,ccnode);
		}
	},
	
	ondomchange	: function(records,observer) {
		Circular.debug.write('@watchdog.ondomchange',records);
		
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
					Circular.log.error('@watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	

	watchdata	: function(node,ccnode) {
		if (ccnode.flags.attrdomchanged || ccnode.flags.attrsetchanged) {
			Circular.debug.write('@watchdog.watchdata',node,ccnode);
			
			ccnode.attributes.forEach(function(ccattr,idx) {
				if (ccattr.flags.attrdomchanged) {
					if (ccattr.paths && ccattr.paths.length) {
						
						var ignorepaths = [];
						if (!ccattr.oldpaths) ccattr.oldpaths = [];
						
						// remove old paths
						if (ccattr.oldpaths.length) {
							ccattr.oldpaths.forEach(function(oldpath) {
								if (this.pathobservers[oldpath]) {
									if (ccattr.paths.indexOf(oldpath)==-1) {
										Circular.debug.write('@watchdog.watchdata','removing  path',oldpath);
										var object=null,subpath='';
										var split = oldpath.indexOf('.');
										if (split!=-1) subpath = oldpath.substring(split+1)
										if (subpath) {
											for (var pc=0;pc<this.pathobservers[oldpath].properties.length;pc++) {
												var property = this.pathobservers[oldpath].properties[pc];
												if (property && property.node==node && property.type=='attribute' && property.id == ccattr.name) {
													delete this.pathobservers[oldpath].properties[pc];
													if (!this.pathobservers[oldpath].properties.length) {
														Circular.debug.write('@watchdog.watchdata','closing pathobserver',oldpath);
														this.pathobservers[oldpath].observer.close();
														delete this.pathobservers[oldpath];
														this.countpobs--;
													}
												}
											}
										} else {
											Circular.log.error('@watchdog.watchdata','cant split path '+path);
										}
									}
								}
							},this);
							ccattr.oldpaths = [];
						} 
						
						// add new paths
						ccattr.paths.forEach(function(path) {
							if (ccattr.oldpaths.indexOf(path)==-1) {
								Circular.debug.write('@watchdog.watchdata','adding path',path);
								var object=null,subpath='';
								var split = path.indexOf('.');
								if (split==-1) {
									Circular.log.warn('@watchdog.watchdata','observe cannot be called on the global proxy object',path);
								} else {
									object 	= Circular.parser.eval(path.substring(0,split));
									subpath = path.substring(split+1)
								}
								if (object && subpath) {
									var property = {
										'node'		:	node,
										'type'		: 'attribute',
										'id'			: ccattr.name
									};
									if (!this.pathobservers[path]) {
										if (object !== window) {
											this.pathobservers[path] = {
												'observer'	: new PathObserver(object,subpath),
												'properties': [property]
											};
											this.countpobs++;
											this.pathobservers[path].observer.open(function(newvalue,oldvalue) {
												Circular.watchdog.ondatachange(path,newvalue,oldvalue)
											});
										} else {
											Circular.log.warn('@watchdog.watchdata','observe cannot be called on the global proxy object',path);
										}
									} else {
										this.pathobservers[path].properties.push(property);
									}
								} else {
									Circular.log.error('@watchdog.watchdata','cant split path ',path);
								}
							} else {
								Circular.debug.write('@watchdog.watchdata','path already watched',path);
							}
						},this);
					
					} else {
						Circular.debug.write('@watchdog.watchdata','no paths',attr.name);
					}

					ccnode.flags.dataobserved=true;
				} else {
					Circular.debug.write('@watchdog.watchdata','no attrdomchanged',attr.name);
				}
			},this);
		} else {
			Circular.debug.write('@watchdog.watchdata','no attrdomchanged in node',node.tagName);
		}
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		Circular.debug.write('@watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.catch(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('@watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		//Circular.debug.write('@watchdog.pass');
		this.catch(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		//Circular.debug.write('@watchdog.ignore');
		this.catch(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		//Circular.debug.write('@watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.catch(node,'unignore',event,target);
	},

	catch	: function(node,type,flag,target) {
		Circular.debug.write('@watchdog.catch',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.eventsin.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.eventsin.nodes.length;
			this.eventsin.nodes.push(node);
		}
		if (!this.eventsin.records[nodeidx]) {
			this.eventsin.records[nodeidx] = [];
		}
		this.eventsin.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.queue.add(function() {
				Circular.watchdog.release();
			});
		}, Circular.config.watchdogtimeout);
		
	},
	
	release	: function() {
	
		Circular.debug.write('@watchdog.release');

		// copy & clean caught to releaseing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('@watchdog.release','found lock: another watchdog seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.eventsout,this.eventsin);
		this.eventsin.nodes = [];
		this.eventsin.records = [];
		

		for (var nc=0;nc<this.eventsout.nodes.length;nc++) {
			var node			= this.eventsout.nodes[nc];
			var records 	= this.eventsout.records[nc];
			var ccnode 		= Circular.registry.get(node);
			
			// {type,flag,target}
			for (var rc=0; rc<records.length;rc++) {
				var record = records[rc];
				var processing = false;
				switch (record.type) {
					case 'event' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (ccnode.name2ccattr[record.target]) {
									
										if (ccnode.name2ccattr[record.target].flags[record.flag+':i']) {
											Circular.debug.write('@watchdog.release','ccattr ignoring flag',record.flag);
											break;
										}
										if (ccnode.name2ccattr[record.target].flags[record.flag+':p']) {
											Circular.debug.write('@watchdog.release','ccattr passing flag',record.flag);
											ccnode.name2ccattr[record.target].flags[record.flag+':p']--;
											break;
										}
										Circular.debug.write('@watchdog.release',record.flag,record.target,node);
										ccnode.name2ccattr[record.target].flags[record.flag]=true;
										ccnode.flags[record.flag]=true;
										ccnode.flags.processing=true;
									} else {
										Circular.debug.write('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
							
								if (ccnode.flags['contentchanged:i']) {
									Circular.debug.write('@watchdog.release','node ignoring contentchanged');
									break;
								}
								if (ccnode.flags['contentchanged:p']) {
									Circular.debug.write('@watchdog.release','node passing contentchanged');
									ccnode.flags['contentchanged:p']--;
									break;
								}
								Circular.debug.write('@watchdog.release','contentchanged',record,node);
								ccnode.flags['contentchanged']=true;
								ccnode.flags.processing=true;
								break;
								
							case 'attrsetchanged':
							
								if (ccnode.flags['attrsetchanged:i']) {
									Circular.debug.write('@watchdog.release','node ignoring attrsetchanged');
									break;
								}
								if (ccnode.flags['attrsetchanged:p']) {
									Circular.debug.write('@watchdog.release','node passing attrsetchanged');
									ccnode.flags['attrsetchanged:p']--;
									break;
								}
								Circular.debug.write('@watchdog.release','attrsetchanged',record,node);
								ccnode.flags['attrsetchanged']=true;
								ccnode.flags.processing=true;
								break;
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'pass' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (ccnode.name2ccattr[record.target]) {
										ccnode.name2ccattr[record.target].flags[record.flag+':p']++;
									} else {
										Circular.debug.write('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
								ccnode.flags['contentchanged:p']++;
								break;
							
							case 'attrsetchanged':
								ccnode.flags['attrsetchanged:p']++;
								break;
								
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'ignore' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (ccnode.name2ccattr[record.target]) {
										ccnode.name2ccattr[record.target].flags[record.flag+':i']=true;
									} else {
										Circular.debug.write('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;

							case 'contentchanged':
								ccnode.flags['contentchanged:i']=true;
								break;
								
							case 'attrsetchanged':
								ccnode.flags['attrsetchanged:i']=true;
								break;
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					case 'unignore' :
						switch (record.flag) {
						
							// ccattr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (ccnode.name2ccattr[record.target]) {
										ccnode.name2ccattr[record.target].flags[record.flag+':i']=false;
									} else {
										Circular.debug.write('@watchdog.release','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('@watchdog.release','ccattr event target missing ',record);
								}
								break;

							case 'contentchanged':
								ccnode.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('@watchdog.release','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('@watchdog.release','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (ccnode.flags.processing) {
				Circular.registry.set(node,ccnode);
			}
		};
		
		// make hte array unsparse
		var todo = [];

		this.eventsout.nodes.forEach(function(node) { 
			var ccnode = Circular.registry.get(node);
			if (ccnode.flags.processing) {
				todo.push(node); 
				Circular.registry.lock(node);
			}
		});
		if (todo.length) {
			Circular.debug.write('recycling '+todo.length+' nodes');
			if (Circular.debug.enabled) this.report(this.eventsout);		
			Circular.engine.recycle(todo,true);
		}
		this.eventsout = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.eventsin;
		Circular.log.write('@watchdog.report======================');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
		Circular.log.write('======================================');
	}

	
	
	
		
});
	