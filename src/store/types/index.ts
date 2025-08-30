import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store.ts';

export const useAppDispatch = () => useDispatch<AppDispatch>();