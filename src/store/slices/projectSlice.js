import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  vertices: [],
  projectedVertices: [],
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    updateVertices: (state, action) => {
      state.vertices = action.payload;
    },
    updateProjectedVertices: (state, action) => {
      state.projectedVertices = action.payload;
    },
  },
});

export const { updateVertices, updateProjectedVertices } = projectSlice.actions;
export default projectSlice.reducer;