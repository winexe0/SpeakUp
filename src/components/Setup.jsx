import React, { useState, useEffect } from 'react';

export default function Setup({ onComplete }) {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    likes: '',
    strengths: '',
    improve: ''
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('onthespot_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Could not parse saved profile", e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('onthespot_profile', JSON.stringify(profile));
    onComplete(profile);
  };

  return (
    <div className="card">
      <h1 className="header-title">🌟 Welcome to OnTheSpot!</h1>
      <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '5px' }}>
        <strong>OnTheSpot</strong> is an interactive quiz that helps you practice responding to real-world social situations — on the spot! You'll be given a scenario and have <strong>60 seconds</strong> to think of and share your response, either by typing or speaking out loud. An AI coach will then give you personalized, supportive feedback on how you did.
      </p>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#788c82', fontSize: '0.95rem' }}>
        To get started, fill out your profile below so we can tailor the feedback to you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Age:</label>
          <input
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            placeholder="Your age"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="form-group">
          <label>What do you like to do? (Likes)</label>
          <textarea
            name="likes"
            value={profile.likes}
            onChange={handleChange}
            placeholder="Example: I like playing Minecraft, reading about dinosaurs, and drawing."
            required
          />
        </div>

        <div className="form-group">
          <label>Your strengths:</label>
          <textarea
            name="strengths"
            value={profile.strengths}
            onChange={handleChange}
            placeholder="Example: I am very honest, I know a lot about trains, and I am good at solving puzzles."
            required
          />
        </div>

        <div className="form-group">
          <label>Things to improve on:</label>
          <textarea
            name="improve"
            value={profile.improve}
            onChange={handleChange}
            placeholder="Example: I want to get better at looking at people when they talk and not interrupting."
            required
          />
        </div>

        <div className="button-group">
          <button type="submit">💾 Save & Continue</button>
        </div>
      </form>
    </div>
  );
}
