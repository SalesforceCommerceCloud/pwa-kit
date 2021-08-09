import {createSelector} from 'reselect'

const getUI = ({ui}) => ui

export const get<%= context.Name %> = createSelector(getUI, (uiState) => uiState.pages.<%= context.name %>)
