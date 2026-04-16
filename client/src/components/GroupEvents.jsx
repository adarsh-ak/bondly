// import { useState, useEffect } from 'react';
// import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Button } from '../components/ui/button';
// import { Badge } from '../components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
// import { Calendar as CalendarComponent } from '../components/ui/calendar';
// import { useAuth } from '../hooks/useAuth';
// // import { supabase } from '../intergrations/supabase/client';
// import { useToast } from '../hooks/use-toast';

// const GroupEvents = () => {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [events, setEvents] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) return;

//     const loadEvents = async () => {
//       setLoading(true);
//       try {
//         // Get groups the user is a member of
//         const { data: groupMemberships, error: memberError } = await supabase
//           .from('group_members')
//           .select('group_id')
//           .eq('user_id', user.id);

//         if (memberError) throw memberError;

//         const groupIds = groupMemberships?.map(m => m.group_id) || [];

//         if (groupIds.length === 0) {
//           setEvents([]);
//           setLoading(false);
//           return;
//         }

//         // Load events from these groups
//         const { data: eventsData, error: eventsError } = await supabase
//           .from('events')
//           .select(`
//             *,
//             groups!inner(name)
//           `)
//           .in('group_id', groupIds)
//           .gte('event_date', new Date().toISOString())
//           .order('event_date', { ascending: true });

//         if (eventsError) throw eventsError;

//         // Check participation status
//         const { data: participations, error: partError } = await supabase
//           .from('event_participants')
//           .select('event_id')
//           .eq('user_id', user.id);

//         if (partError) throw partError;

//         const participantEventIds = participations?.map(p => p.event_id) || [];

//         const formattedEvents = eventsData?.map(event => ({
//           id: event.id,
//           title: event.title,
//           description: event.description || '',
//           event_date: event.event_date,
//           location: event.location || '',
//           group_id: event.group_id,
//           group_name: event.groups?.name,
//           is_participant: participantEventIds.includes(event.id)
//         })) || [];

//         setEvents(formattedEvents);
//       } catch (error) {
//         console.error('Error loading events:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to load events',
//           variant: 'destructive'
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadEvents();

//     // Set up realtime subscription
//     const channel = supabase
//       .channel('events-changes')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'events'
//         },
//         () => loadEvents()
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [user, toast]);

//   const joinEvent = async (eventId) => {
//     if (!user) return;

//     try {
//       const { error } = await supabase
//         .from('event_participants')
//         .insert({
//           event_id: eventId,
//           user_id: user.id,
//           status: 'going'
//         });

//       if (error) throw error;

//       setEvents(prev => prev.map(e => 
//         e.id === eventId ? { ...e, is_participant: true } : e
//       ));

//       toast({
//         title: 'Success',
//         description: 'You\'re now attending this event!'
//       });
//     } catch (error) {
//       console.error('Error joining event:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to join event',
//         variant: 'destructive'
//       });
//     }
//   };

//   const leaveEvent = async (eventId) => {
//     if (!user) return;

//     try {
//       const { error } = await supabase
//         .from('event_participants')
//         .delete()
//         .eq('event_id', eventId)
//         .eq('user_id', user.id);

//       if (error) throw error;

//       setEvents(prev => prev.map(e => 
//         e.id === eventId ? { ...e, is_participant: false } : e
//       ));

//       toast({
//         title: 'Success',
//         description: 'You\'ve left this event'
//       });
//     } catch (error) {
//       console.error('Error leaving event:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to leave event',
//         variant: 'destructive'
//       });
//     }
//   };

//   const eventsOnSelectedDate = events.filter(event => {
//     if (!selectedDate) return false;
//     const eventDate = new Date(event.event_date);
//     return (
//       eventDate.getDate() === selectedDate.getDate() &&
//       eventDate.getMonth() === selectedDate.getMonth() &&
//       eventDate.getFullYear() === selectedDate.getFullYear()
//     );
//   });

//   const datesWithEvents = events.map(e => new Date(e.event_date));

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2">Community Events</h1>
//         <p className="text-muted-foreground">
//           Events from groups you're following
//         </p>
//       </div>

//       <Tabs defaultValue="calendar" className="space-y-6">
//         <TabsList>
//           <TabsTrigger value="calendar">
//             <Calendar className="h-4 w-4 mr-2" />
//             Calendar View
//           </TabsTrigger>
//           <TabsTrigger value="list">
//             <Clock className="h-4 w-4 mr-2" />
//             List View
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="calendar" className="space-y-6">
//           <div className="grid md:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Event Calendar</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CalendarComponent
//                   mode="single"
//                   selected={selectedDate}
//                   onSelect={setSelectedDate}
//                   className="rounded-md border"
//                   modifiers={{
//                     hasEvent: datesWithEvents
//                   }}
//                   modifiersStyles={{
//                     hasEvent: {
//                       fontWeight: 'bold',
//                       backgroundColor: 'hsl(var(--primary) / 0.1)'
//                     }
//                   }}
//                 />
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>
//                   {selectedDate
//                     ? `Events on ${selectedDate.toLocaleDateString()}`
//                     : 'Select a date'}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {eventsOnSelectedDate.length === 0 ? (
//                   <p className="text-muted-foreground text-center py-8">
//                     No events on this date
//                   </p>
//                 ) : (
//                   <div className="space-y-4">
//                     {eventsOnSelectedDate.map(event => (
//                       <Card key={event.id} className="border-l-4 border-l-primary">
//                         <CardContent className="p-4">
//                           <div className="flex justify-between items-start mb-2">
//                             <div>
//                               <h4 className="font-semibold">{event.title}</h4>
//                               <p className="text-sm text-muted-foreground">
//                                 {event.group_name}
//                               </p>
//                             </div>
//                             <Badge variant={event.is_participant ? 'default' : 'outline'}>
//                               {event.is_participant ? 'Attending' : 'Not Attending'}
//                             </Badge>
//                           </div>
//                           <p className="text-sm mb-3">{event.description}</p>
//                           <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
//                             <span className="flex items-center gap-1">
//                               <Clock className="h-4 w-4" />
//                               {new Date(event.event_date).toLocaleTimeString()}
//                             </span>
//                             {event.location && (
//                               <span className="flex items-center gap-1">
//                                 <MapPin className="h-4 w-4" />
//                                 {event.location}
//                               </span>
//                             )}
//                           </div>
//                           <Button
//                             size="sm"
//                             variant={event.is_participant ? 'outline' : 'default'}
//                             onClick={() => event.is_participant ? leaveEvent(event.id) : joinEvent(event.id)}
//                             className="w-full"
//                           >
//                             {event.is_participant ? 'Leave Event' : 'Join Event'}
//                           </Button>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="list" className="space-y-4">
//           {loading ? (
//             <p className="text-center text-muted-foreground">Loading events...</p>
//           ) : events.length === 0 ? (
//             <Card>
//               <CardContent className="p-12 text-center">
//                 <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
//                 <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
//                 <p className="text-muted-foreground mb-4">
//                   Join groups to see their events here
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {events.map(event => (
//                 <Card key={event.id} className="hover:shadow-lg transition-shadow">
//                   <CardContent className="p-6">
//                     <div className="flex justify-between items-start mb-3">
//                       <Badge variant="outline">{event.group_name}</Badge>
//                       <Badge variant={event.is_participant ? 'default' : 'secondary'}>
//                         {event.is_participant ? 'Attending' : 'Not Attending'}
//                       </Badge>
//                     </div>
//                     <h3 className="font-bold text-lg mb-2">{event.title}</h3>
//                     <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
//                       {event.description}
//                     </p>
//                     <div className="space-y-2 text-sm mb-4">
//                       <div className="flex items-center gap-2 text-muted-foreground">
//                         <Calendar className="h-4 w-4" />
//                         {new Date(event.event_date).toLocaleDateString()}
//                       </div>
//                       <div className="flex items-center gap-2 text-muted-foreground">
//                         <Clock className="h-4 w-4" />
//                         {new Date(event.event_date).toLocaleTimeString()}
//                       </div>
//                       {event.location && (
//                         <div className="flex items-center gap-2 text-muted-foreground">
//                           <MapPin className="h-4 w-4" />
//                           {event.location}
//                         </div>
//                       )}
//                     </div>
//                     <Button
//                       size="sm"
//                       variant={event.is_participant ? 'outline' : 'default'}
//                       onClick={() => event.is_participant ? leaveEvent(event.id) : joinEvent(event.id)}
//                       className="w-full"
//                     >
//                       {event.is_participant ? 'Leave Event' : 'Join Event'}
//                     </Button>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default GroupEvents;