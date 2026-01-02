import {Platform, StyleSheet} from 'react-native';

export default StyleSheet.create({
  baseModalView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  des: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400',
    color: '#666666',
    marginLeft: 4,
  },
  ListItemCode: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  commonModalRow: {
    height: 32,
    borderBottomWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    borderRadius: 8,
  },
  autoPositionedPopupList: {
    // V11: Restore original layout - popup maintains fixed 200px height
    // Content renders at top, user requirement: no auto-sizing
    flex: 1,
    height: '100%',
    padding: 12,
  },
  inputStyle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    color: '#333333',
    width: '90%',
    textAlign: 'right',
    flex: 1,
    includeFontPadding: false,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  AutoPositionedPopupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchQueryTxt: {
    fontSize: 17,
    lineHeight: 24,
    color: '#999999',
    textAlign: 'right',
  },
  contain: {
    flex: 1,
    height: '100%',
  },
  selectArrow: {
    marginLeft: 6,
    marginRight: 8,
    width: 8,
    height: 14,
  },
  AutoDropdownBtnStyle1: {
    justifyContent: 'flex-start',
  },
  AutoDropdownBtnStyle: {
    justifyContent: 'flex-end',
  },
  usageRowText: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '400',
    color: '#333333',
  },
  AutoDropdownRow: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
