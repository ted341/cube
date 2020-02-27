#include <iostream>
#include <iomanip>
#include <vector>
#include <set>
#include <cassert>
extern "C"{
#include <glpk.h>
}

using namespace std;

void massert(bool passed, const char *msg)
{
	if(!passed)
	{
		cerr << msg << endl;
		assert(0);
	}
}

/*
** optimize z = c^T x  (optimize: GLP_MIN or GLP_MAX)
** subject to Ax <= b
**
** return z
*/

double lp_solver(int optimize, int thr, vector<double> &c, vector< vector<double> > &A, vector<double> &x, vector<double> &b){

	massert(c.size() == x.size(), "c's length doesn't match x's length");
	massert(A[0].size() == x.size(), "# cols in A doesn't match x's length");
	massert(A.size() == b.size(), "# rows in A doesn't match b's length");

	glp_prob *lp = glp_create_prob();
	///*
	glp_smcp parameter;
	glp_init_smcp(&parameter);
	parameter.msg_lev = GLP_MSG_ERR;
	//*/
	/*
	glp_iocp parameter;
	glp_init_iocp(&parameter);
	parameter.presolve = GLP_ON;
	*/

	glp_set_obj_dir(lp, optimize);
	glp_add_rows(lp, A.size());
	glp_add_cols(lp, A[0].size());

	for(int i=0; i<b.size(); ++i){
		if (i < thr) glp_set_row_bnds(lp, i+1, GLP_UP, 0, b[i]);
		else glp_set_row_bnds(lp, i+1, GLP_FX, b[i], b[i]);
	}

	for(int i=0; i<x.size(); ++i){
		glp_set_col_kind(lp, i+1, GLP_IV);
		glp_set_col_bnds(lp, i+1, GLP_DB, 0, 1);
		glp_set_obj_coef(lp, i+1, c[i]);
	}

	int ptr = 0;
	int m = A.size()*(A[0].size());
	int *ia = new int [m+1];
	int *ja = new int [m+1];
	double *ar = new double [m+1];

	for(int i=0; i<A.size(); ++i){
		for(int j=0; j<A[0].size(); ++j){
			++ptr;
			ia[ptr] = i+1;
			ja[ptr] = j+1;
			ar[ptr] = A[i][j];
		}
	}

	glp_load_matrix(lp, ptr, ia, ja, ar);

	glp_simplex(lp, &parameter);
	//glp_exact(lp, &parameter);
	//glp_intopt(lp, &parameter);

	//double z = glp_get_obj_val(lp);
	double z = glp_mip_obj_val(lp);

	for(int i=0; i<x.size(); ++i){
		//x[i] = glp_get_col_prim(lp, i+1);
		x[i] = glp_mip_col_val(lp, i+1);
	}

	glp_delete_prob(lp);

	return z;
}

int main()
{
	int size = 3, color = 4;

	// testcase:
	//	size = 3, color = 4
	int SanD[8] = {0, 23, 13, 20, 8, 10, 9, 26}; // work starter 57 work
	// size = 4, color = 8
	// int SanD[16] = {44, 38, 0, 11, 15, 43, 19, 24, 6, 22, 10, 34, 26, 32, 45, 47}; // starter 103 work
	// size = 4, color = 6
  	//int SanD[12] = {28, 32, 9, 26, 35, 44, 34, 36, 0, 29, 10, 25}; // 3dlogic-9 failed
	// size = 5, color = 6
	//int SanD[12] = {59, 49, 3, 68, 7, 32, 40, 10, 1, 37, 17, 57}; // 3dlogic-16 failed
	// size = 5, color = 5
	// int SanD[10] = {45, 51, 46, 12, 3, 37, 0, 36, 1, 32}; //3dlogic-19 failed
	// size = 4, color = 8
	// int SanD[16] = {18, 25, 14, 31, 6, 24, 10, 12, 0, 8, 40, 47, 5, 41, 22, 38}; // starter 59 work
	/*
		block idx: | vertex of plane 0 | vertex of plane 1 | ... | ->
	*/

	set<int> sdLookUp;

	for (int i = 0; i < color; i++)
	{
		sdLookUp.insert(SanD[i*2]);
		sdLookUp.insert(SanD[i*2+1]);
	}


	int edgeNum = 0;
	int bpp = size * size; // blocks per plane
	int blks = 3 * bpp; // total num of blocks
	vector<int *> edgeList; // pair of vertices: (i1,j1), (j1,i1)...
	vector< vector<int> > adj(blks, vector<int>(blks, 0)); // adjacency matrix

	for (int i = 0; i < blks; i++)
	{
		for (int j = 0; j < blks; j++)
		{
			if (i == j);
			else if (i > j) adj[i][j] = adj[j][i];
			else // (i < j)
			{
				// section Y
				if ((i%bpp < size) && ((j%bpp) == (i%bpp*size) && (i/bpp+1) == (j/bpp))) adj[i][j] = 1;
				else if ((i%bpp%size == 0) && ((i%bpp) == (j%bpp*size) && (i/bpp+2) == (j/bpp))) adj[i][j] = 1;

				// general...
				if (j == (i+1) && (j/size) == (i/size)) adj[i][j] = 1;
				else if (j == (i+size) && (j/bpp) == (i/bpp)) adj[i][j] = 1;

				if (adj[i][j] == 1)
				{
					// for management purpose
					int p[2] = {i, j};
					int q[2] = {j, i};
					edgeList.push_back(p);
					edgeList.push_back(q);
					edgeNum += 2;
				}
			}
		}
	}

	/*
		flow: | flow of color 0 | flow of color 1 | ... |
	*/
	int var = edgeNum * color;
	vector< vector<double> > cc; // coefficients of constraints
	vector<double> cv; // values of constraints
	vector<double> u, v;

	// each edge no more than one flow ( <=1 )
	for (int i = 0; i < edgeNum/2; i++)
	{
		v.clear();
		v.resize(var, 0);

		for (int j = 0; j < color; j++)
		{
			v[i*2 + j*edgeNum] = 1;
			v[i*2 + j*edgeNum + 1] = 1;
		}

		cc.push_back(v);
		cv.push_back(1);
	}

	/*
		for non-s,d vertex v, flow conserved for same color...(input_i = output_i)
		Σ fi(v, k) - Σ fi(k, v) = 0
	*/
	for (int i = 0; i < blks; i++)
	{
		if (sdLookUp.find(i) == sdLookUp.end()) // not found
		{
			for (int j = 0; j < color; j++) // for each color
			{
				v.clear();
				v.resize(var, 0);

				for (int k = 0; k < edgeNum; k++)
				{
					if (edgeList[k][0] == i) v[j*edgeNum + k] = 1;
					else if (edgeList[k][1] == i) v[j*edgeNum + k] = -1;
				}

				cc.push_back(v);
				cv.push_back(0);
			}
		}
	}
	/*
		source:
		flows of the color derived from it sum up in one,
		flows head into it don't exist as well as flows of other colors derived from it.
	*/
	/*
		Σ fi(s, k) = 1
	*/
	for (int i = 0; i < color; i++)
	{
		v.clear(); v.resize(var, 0);
		u.clear(); u.resize(var, 0);

		for (int j = 0; j < var; j++)
		{
			if (edgeList[j%edgeNum][0] == SanD[i*2]) // check vertex
			{
				if (j/edgeNum == i) v[j] = 1;
				else u[j] = 1;
			}
			else if (edgeList[j%edgeNum][1] == SanD[i*2]) u[j] = 1;
		}

		cc.push_back(v); cv.push_back(1);
		cc.push_back(u); cv.push_back(0);
	}

	// for destination
	/*
		Σ fi(j, d) = 1, for each d
	*/
	for (int i = 0; i < color; i++)
	{
		v.clear(); v.resize(var, 0);
		u.clear(); u.resize(var, 0);

		for (int j = 0; j < var; j++)
		{
			if (edgeList[j%edgeNum][1] == SanD[i*2+1])
			{
				if (j/edgeNum == i) v[j] = 1;
				else u[j] = 1;
			}
			else if (edgeList[j%edgeNum][0] == SanD[i*2+1]) u[j] = 1;
		}

		cc.push_back(v); cv.push_back(1);
		cc.push_back(u); cv.push_back(0);
	}

	vector<double> flow(var, 0); // cv = cc * flow
	vector<double> obj(var, 1); // coefficients of object function
	double z = lp_solver(GLP_MIN, edgeNum/2, obj, cc, flow, cv);

	//cout << "the optimal objective value is " << z << endl;
	/*
	cout << "the optimal solution is (";
	for(int i=0; i<var; ++i)
		cout << flow[i] << ((i==(var-1)) ? "" : ",");
	cout << ")" << endl;
	//*/

	for (int i = 0; i < var; i++){
		cout << flow[i];
	}

	vector<char> board[3];
	for (int i = 0; i < 3; i++)
	{
		board[i].clear();
		board[i].resize(bpp, '.');
	}

	for (int i = 0; i < var; i++)
	{
		if (flow[i] == 1)
		{
			int j = edgeList[i%edgeNum][0];
			int k = edgeList[i%edgeNum][1];
			board[j/bpp][j%bpp] = i/edgeNum + 48;
			board[k/bpp][k%bpp] = i/edgeNum + 48;
		}
	}

	for (int i = 0; i < size*2; i++)
	{
		for (int j = 0; j < size*2; j++)
		{
			if (i < size && j < size) cout << "  ";
			else if (i < size) cout << board[1][(j-size)*size+size-1-i] << " ";
			else if (j < size) cout << board[2][(size-1-j)*size+i-size] << " ";
			else cout << board[0][(i-size)*size+j-size] << " ";
		}
		cout << endl;
	}

	/* print solution
	map<int, int> route;
	int count = 0;
	for (int i = 0; i < var; i++)
	{
			if (flow[i] == 1)
			{
					route[edgeList[i%edgeNum][0]] = edgeList[i%edgeNum][1];
					//cout << "(" << edgeList[i%edgeNum][0] << "," << edgeList[i%edgeNum][1] << ")" << endl;
					count++;
			}
	}
	//cout << endl << count << endl;
	//*/
	/*
	for (int i = 0; i < var; i++)
	{
			if (flow[i] != 0 && flow[i] != 1)
			{
					cout << "(" << edgeList[i%edgeNum][0] << "," << edgeList[i%edgeNum][1] << ") ";
					cout << "has flow " << flow[i] << endl;
			}
	}
	//*/
	/*
	for (int i = 0; i < var; i++)
	{
			if (i%edgeNum < edgeNum/2)
					if (flow[i] != 0 && flow[i+edgeNum/2] != 0)
					{
							cout << edgeList[i%edgeNum][0] << " and " << edgeList[i%edgeNum][1] << " have bidirectinal flows. ";
							cout << "(" << flow[i] << "," << flow[i+edgeNum/2] << ")" << endl;
					}
	}
	//*/
	/*
	for (int i = 0; i < color; i++)
	{
			int p = SanD[i*2];
			cout << "color " << i << ": " << p;
			while(1)
			{
					cout << " -> " << route[p];
					if (route[p] == SanD[i*2+1]) break;
					p = route[p];
			}
			cout << endl;
	}
	//*/
	/* print lp
	cout << "------------" << endl;
	for (int i = 0; i < cc.size(); i++)
	{
			for (int j = 0; j < var; j++)
					cout << setw(2) << cc[i][j] << " ";
			cout << "| " << setw(2) << cv[i] << endl;
	}
	*/
	/* print edgeList
	for (int i = 0; i < edgeNum; i++)
	{
			cout << "(" << edgeList[i][0] << "," << edgeList[i][1] << ")";
			if (i%10 == 9) cout << endl;
			if (i < edgeNum-1) cout << ", ";
	}
	cout << endl;
	*/

	return 0;
}
