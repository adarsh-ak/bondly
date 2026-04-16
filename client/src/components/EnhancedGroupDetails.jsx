import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, MapPin, Calendar, Settings, MessageCircle, 
  Heart, Share2, Clock, Trophy, Star, UserPlus, UserMinus,
  Edit, Trash2, Crown, Shield, AlertCircle, ChevronRight, Pin
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GroupDetails = ({ navigate, groupId, user }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setGroup(data.data);
        if (user) {
          setIsJoined(data.data.members.some(member => member._id === user.id));
        }
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = isJoined ? 'leave' : 'join';
      const response = await fetch(`${API_URL}/groups/${groupId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setIsJoined(!isJoined);
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Group not found</p>
          <button 
            onClick={() => navigate('/groups')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.id === group.creator._id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <button 
          onClick={() => navigate('/groups')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </button>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-start space-x-6">
                <img 
                  src={group.image}
                  alt={group.name}
                  className="w-24 h-24 rounded-xl object-cover shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{group.memberCount} members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{group.location || 'No location'}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => setShowEditDialog(true)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Manage
                      </button>
                    )}
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {group.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {group.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user ? (
                <>
                  <button 
                    onClick={handleJoinLeave}
                    className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      isJoined 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Leave Group
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Join Group
                      </>
                    )}
                  </button>
                  
                  {isJoined && (
                    <button 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      onClick={() => navigate('/messages')}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Group Chat
                    </button>
                  )}
                </>
              ) : (
                <button 
                  onClick={() => navigate('/auth')}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Sign in to Join
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {['overview', 'members', 'about'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium capitalize ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About This Community */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">About This Community</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {group.description}
                </p>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Community Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{group.memberCount}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{group.category}</div>
                    <div className="text-sm text-gray-600">Category</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Group Admin */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Group Admin</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {group.creator.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{group.creator.username}</h4>
                    <p className="text-sm text-gray-600">{group.creator.fullName}</p>
                    <p className="text-xs text-gray-500">
                      Admin since {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6">About This Group</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {group.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Group Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="text-gray-900">{group.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="text-gray-900">{group.location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="text-gray-900">{group.memberCount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Be respectful and welcoming to all members</li>
                    <li>• Share your experiences and knowledge</li>
                    <li>• Attend events regularly if possible</li>
                    <li>• Help newcomers feel included</li>
                    <li>• Follow community standards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Members ({group.memberCount})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.members.map((member) => (
                <div key={member._id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {member.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.username}</h4>
                    <p className="text-sm text-gray-600">{member.fullName}</p>
                    {member._id === group.creator._id && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1 inline-flex items-center">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit/Manage Dialog */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold">Manage Group Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button className="h-20 flex flex-col items-center justify-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Edit className="h-6 w-6" />
                    <span>Edit Details</span>
                  </button>
                  <button className="h-20 flex flex-col items-center justify-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Users className="h-6 w-6" />
                    <span>Manage Members</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowEditDialog(false);
                      navigate('/events');
                    }}
                    className="h-20 flex flex-col items-center justify-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Create Event</span>
                  </button>
                  <button className="h-20 flex flex-col items-center justify-center space-y-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Settings className="h-6 w-6" />
                    <span>Group Settings</span>
                  </button>
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowEditDialog(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;