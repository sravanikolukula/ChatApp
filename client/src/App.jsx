import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Profile from "./Pages/Profile";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import CreateGroup from "./Components/CreateGroup";
import AddGrpMembers from "./Components/AddGrpMembers";

const App = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthContext();

  return (
    <div className="bg-cover bg-center min-h-screen bg-[#1c1c1c]">
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={authUser ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!authUser ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={authUser ? <Profile /> : <Navigate to="/login" />}
        />
        <Route path="/group-profile/:id" element={<Profile />} />
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/add-member" element={<AddGrpMembers />} />
      </Routes>
    </div>
  );
};

export default App;
