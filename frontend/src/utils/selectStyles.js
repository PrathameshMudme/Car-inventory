// Shared react-select styles matching original design
export const selectStyles = {
  control: (base, state) => ({
    ...base,
    padding: '2px 0',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(102, 126, 234, 0.15)' : 'none',
    minHeight: '44px',
    '&:hover': {
      borderColor: '#667eea'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#667eea' 
      : state.isFocused 
        ? 'rgba(102, 126, 234, 0.1)' 
        : 'white',
    color: state.isSelected ? 'white' : '#2c3e50',
    padding: '10px 15px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#667eea'
    }
  }),
  placeholder: (base) => ({
    ...base,
    color: '#adb5bd',
    fontSize: '14px'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#2c3e50',
    fontSize: '14px'
  }),
  input: (base) => ({
    ...base,
    color: '#2c3e50',
    fontSize: '14px'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e9ecef',
    marginTop: '5px'
  }),
  menuList: (base) => ({
    ...base,
    padding: '5px'
  })
}
