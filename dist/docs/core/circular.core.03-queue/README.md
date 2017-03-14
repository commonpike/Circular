#Circular.queue#

*description:*

> A queueing utility, part of Circular core. It allows you to queue a single function call, which will instantly be executed if the queue is empty, but which wont be executed untill all previous calls are finished. All circular cycles are passed on the queue, so the only way to modify the document safely is to add your activities to the queue.

----

##methods##

----

###@queue.add(fn)

*arguments:*

- **fn:** (*type:* function, *default:* undefined) 
the method call to queue
 
 





