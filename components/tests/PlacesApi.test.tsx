import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import OnboardingScreen from '../../components/OnboardingScreen';

// Mock fetch for Places API
const mockFetch = jest.spyOn(global, 'fetch' as any);

describe('Google Places API integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('requests autocomplete and shows suggestions', async () => {
    jest.useFakeTimers();
    // Autocomplete response
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'OK', predictions: [ { description: '123 Main St', place_id: 'pid_1' } ] }),
    } as any);

    const { getByPlaceholderText, queryByText, getByText, getByRole } = render(<OnboardingScreen onDone={() => {}} testSkipHowItWorks />);
    // Navigate to step 3 (address input)
    fireEvent.changeText(getByPlaceholderText('Full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Phone number'), '1234567890');
    fireEvent.press(getByText('Next'));
    fireEvent(getByRole('switch'), 'valueChange', true);
    fireEvent.press(getByText('Next'));
    // step 2 requires animation to complete
    act(() => { jest.advanceTimersByTime(3000); });
    fireEvent.press(getByText('Next')); // to step 3
    const input = getByPlaceholderText('Enter an address');

    fireEvent.changeText(input, '123 Ma');
    // debounce timer for autocomplete
    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(queryByText('123 Main St')).toBeTruthy();
    });
    jest.useRealTimers();
  });

  it('fetches place details on suggestion tap', async () => {
    jest.useFakeTimers();
    // Autocomplete
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'OK', predictions: [ { description: '123 Main St', place_id: 'pid_1' } ] }),
    } as any);
    // Place details
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ result: { geometry: { location: { lat: 37.1, lng: -122.2 } } } }),
    } as any);

    const { getByPlaceholderText, findByText, getByText, getByRole } = render(<OnboardingScreen onDone={() => {}} testSkipHowItWorks />);
    fireEvent.changeText(getByPlaceholderText('Full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Phone number'), '1234567890');
    fireEvent.press(getByText('Next'));
    fireEvent(getByRole('switch'), 'valueChange', true);
    fireEvent.press(getByText('Next'));
    act(() => { jest.advanceTimersByTime(3000); });
    fireEvent.press(getByText('Next')); // to step 3
    const input = getByPlaceholderText('Enter an address');
    fireEvent.changeText(input, '123 Main');
    act(() => { jest.advanceTimersByTime(350); });

    const suggestion = await findByText('123 Main St');
    fireEvent.press(suggestion);

    // Expect our mocks to have been called twice (autocomplete + details)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});


