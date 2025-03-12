
import React from 'react';

interface UserInfoDisplayProps {
  email: string | null;
  userId?: string | null;
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ email, userId }) => {
  if (!email) return null;
  
  return (
    <div className="text-sm text-muted-foreground">
      Logged in as: {email}
      {userId && <span className="ml-2">(ID: {userId})</span>}
    </div>
  );
};

export default UserInfoDisplay;
